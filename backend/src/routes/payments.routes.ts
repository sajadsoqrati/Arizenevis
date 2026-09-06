import { Router } from "express";
import { z } from "zod";
import { HelpRequestStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { config } from "../config/env";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import {
  getNextInteractionNumber,
  validateDiscountCode,
  calculateFinalAmount,
  processSuccessfulPayment,
} from "../services/payment.service";
import {
  getPaymentGatewayUrl,
  requestPayment,
  verifyPayment,
} from "../services/zarinpal.service";
import { paramId } from "../utils/params";

const router = Router();

const initiateSchema = z.object({
  discountCode: z.string().optional(),
});

router.post(
  "/initiate/:requestId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = initiateSchema.parse(req.body);
    const requestId = paramId(req.params.requestId);
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
      include: { payment: true, user: true },
    });

    if (!helpRequest) {
      throw new AppError(404, "درخواست یافت نشد");
    }

    if (helpRequest.userId !== req.user!.userId) {
      throw new AppError(403, "دسترسی غیرمجاز");
    }

    if (helpRequest.status !== HelpRequestStatus.PRICED) {
      throw new AppError(400, "این درخواست هنوز قیمت‌گذاری نشده است");
    }

    if (helpRequest.payment?.status === "SUCCESS") {
      throw new AppError(400, "این درخواست قبلاً پرداخت شده است");
    }

    // Never replace a pending attempt that already has a gateway authority.
    // The old authority may still be paid, so deleting or overwriting it could
    // leave the user charged without a matching payment record.
    if (
      helpRequest.payment?.status === "PENDING" &&
      helpRequest.payment.zarinpalAuthority
    ) {
      res.json({
        message: "ادامه پرداخت قبلی",
        gatewayUrl: getPaymentGatewayUrl(
          helpRequest.payment.zarinpalAuthority
        ),
        paymentId: helpRequest.payment.id,
      });
      return;
    }

    const originalPrice = helpRequest.price!;
    const interactionNumber = await getNextInteractionNumber(
      helpRequest.userId
    );

    let discountCodeId: string | undefined;
    let discountAmount = 0;
    let finalAmount = originalPrice;

    const discountCode = data.discountCode?.trim();
    if (discountCode) {
      const discount = await validateDiscountCode(
        discountCode,
        helpRequest.userId,
        interactionNumber
      );
      const calc = calculateFinalAmount(originalPrice, discount.percentOff);
      discountAmount = calc.discountAmount;
      finalAmount = calc.finalAmount;
      discountCodeId = discount.id;
    }

    const payment = helpRequest.payment
      ? await prisma.payment.update({
          where: { id: helpRequest.payment.id },
          data: {
            originalPrice,
            discountAmount,
            finalAmount,
            discountCodeId,
            status: "PENDING",
            zarinpalAuthority: null,
            zarinpalRefId: null,
            paidAt: null,
          },
        })
      : await prisma.payment.create({
          data: {
            helpRequestId: helpRequest.id,
            originalPrice,
            discountAmount,
            finalAmount,
            discountCodeId,
            status: "PENDING",
          },
        });

    if (finalAmount === 0) {
      await processSuccessfulPayment(payment.id);
      res.json({
        message: "پرداخت با موفقیت انجام شد",
        freeCheckout: true,
        redirectUrl: `${config.frontendUrl}/dashboard?paid=true`,
      });
      return;
    }

    const { authority, gatewayUrl } = await requestPayment(
      finalAmount,
      `پرداخت درخواست مشاوره - ${helpRequest.id.slice(-6)}`,
      { mobile: helpRequest.user.phone }
    );

    await prisma.payment.update({
      where: { id: payment.id },
      data: { zarinpalAuthority: authority },
    });

    res.json({
      message: "در حال انتقال به درگاه پرداخت",
      gatewayUrl,
      paymentId: payment.id,
    });
  })
);

router.get(
  "/verify",
  asyncHandler(async (req, res) => {
    const authority = req.query.Authority as string;
    const status = req.query.Status as string;

    if (!authority) {
      res.redirect(`${config.frontendUrl}/dashboard?payment=failed`);
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { zarinpalAuthority: authority },
      include: { helpRequest: true },
    });

    if (!payment) {
      res.redirect(`${config.frontendUrl}/dashboard?payment=failed`);
      return;
    }

    // A repeated callback must never change a completed payment back to FAILED.
    if (payment.status === "SUCCESS") {
      res.redirect(`${config.frontendUrl}/dashboard?payment=success`);
      return;
    }

    if (status !== "OK") {
      await prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: "SUCCESS" },
        },
        data: { status: "FAILED" },
      });
      res.redirect(`${config.frontendUrl}/dashboard?payment=failed`);
      return;
    }

    try {
      const { refId } = await verifyPayment(authority, payment.finalAmount);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { zarinpalRefId: refId },
      });
      await processSuccessfulPayment(payment.id);
      res.redirect(`${config.frontendUrl}/dashboard?payment=success`);
    } catch {
      await prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: "SUCCESS" },
        },
        data: { status: "FAILED" },
      });
      res.redirect(`${config.frontendUrl}/dashboard?payment=failed`);
    }
  })
);

export default router;
