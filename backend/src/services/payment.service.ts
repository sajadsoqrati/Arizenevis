import { HelpRequestStatus, Role } from "@prisma/client";
import { prisma } from "../config/database";
import { calculateCommissionAmount } from "./commission.service";
import { AppError } from "../middleware/errorHandler";

export async function getNextInteractionNumber(userId: string): Promise<number> {
  const paidCount = await prisma.helpRequest.count({
    where: {
      userId,
      status: { in: [HelpRequestStatus.PAID, HelpRequestStatus.ANSWERED] },
    },
  });
  return paidCount + 1;
}

export async function processSuccessfulPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      helpRequest: {
        include: {
          user: {
            include: {
              coworkerLink: { include: { marketerProfile: true } },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.status === "SUCCESS") {
    return payment;
  }

  const helpRequest = payment.helpRequest;
  const interactionNumber =
    helpRequest.interactionNumber ||
    (await getNextInteractionNumber(helpRequest.userId));

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });

    await tx.helpRequest.update({
      where: { id: helpRequest.id },
      data: {
        status: HelpRequestStatus.PAID,
        interactionNumber,
      },
    });

    if (payment.discountCodeId) {
      await tx.discountCode.update({
        where: { id: payment.discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const coworkerLink = helpRequest.user.coworkerLink;
    if (
      helpRequest.user.role === Role.COWORKER &&
      coworkerLink?.marketerProfile
    ) {
      const { rate, amount } = calculateCommissionAmount(
        payment.originalPrice,
        interactionNumber
      );

      await tx.marketerCommission.create({
        data: {
          paymentId: payment.id,
          marketerProfileId: coworkerLink.marketerProfile.id,
          interactionNumber,
          rate,
          amount,
        },
      });
    }
  });

  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: { helpRequest: true, commission: true },
  });
}

export async function validateDiscountCode(
  code: string,
  userId: string,
  interactionNumber: number
) {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount || !discount.isActive) {
    throw new AppError(400, "کد تخفیف نامعتبر است");
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    throw new AppError(400, "ظرفیت استفاده از این کد تخفیف تمام شده است");
  }

  if (discount.firstTimeOnly && interactionNumber > 1) {
    throw new AppError(400, "این کد تخفیف فقط برای اولین خرید قابل استفاده است");
  }

  const existingUse = await prisma.payment.findFirst({
    where: {
      discountCodeId: discount.id,
      helpRequest: { userId },
      status: "SUCCESS",
    },
  });

  if (existingUse) {
    throw new AppError(400, "شما قبلاً از این کد تخفیف استفاده کرده‌اید");
  }

  return discount;
}

export function calculateFinalAmount(
  originalPrice: number,
  percentOff: number
): { discountAmount: number; finalAmount: number } {
  const discountAmount = Math.round((originalPrice * percentOff) / 100);
  const finalAmount = Math.max(0, originalPrice - discountAmount);
  return { discountAmount, finalAmount };
}
