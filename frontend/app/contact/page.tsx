import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما | عریضه نویس",
  description: "راه‌های ارتباط با مجموعه عریضه نویس",
};

export default function ContactPage() {
  return (
    <section className="max-w-3xl mx-auto py-8">
      <div className="card space-y-6">
        <div className="space-y-2">
          <span className="text-4xl" aria-hidden="true">
            ☎️
          </span>
          <h1 className="text-3xl font-bold text-primary">تماس با ما</h1>
        </div>

        <div className="space-y-4 text-gray-600 leading-8">
          <p>
            برای دریافت اطلاعات بیشتر، مطرح کردن پرسش‌ها یا پیگیری درخواست خود
            می‌توانید از راه‌های ارتباطی زیر با ما در تماس باشید. کارشناسان ما در
            اولین فرصت پاسخ‌گوی شما خواهند بود.
          </p>

          <div className="rounded-xl bg-background p-5 space-y-3">
            <p>
              <span className="font-bold text-primary">تلفن:</span>{" "}
              ۰۲۱-۱۲۳۴۵۶۷۸
            </p>
            <p>
              <span className="font-bold text-primary">ایمیل:</span>{" "}
              info@example.com
            </p>
            <p>
              <span className="font-bold text-primary">نشانی:</span> تهران، خیابان
              نمونه، پلاک ۱۲۳
            </p>
          </div>

          <p className="text-sm text-gray-500">
            اطلاعات این صفحه آزمایشی است و می‌توانید آن را با اطلاعات واقعی شرکت
            جایگزین کنید.
          </p>
        </div>
      </div>
    </section>
  );
}
