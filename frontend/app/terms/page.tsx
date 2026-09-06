import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قوانین و مقررات | عریضه نویس",
  description: "قوانین و مقررات استفاده از خدمات عریضه نویس",
};

const sections = [
  {
    title: "۱. پذیرش قوانین",
    content:
      "استفاده از خدمات این وب‌سایت به معنای مطالعه و پذیرش قوانین و مقررات آن است. کاربران موظف‌اند پیش از ثبت‌نام، مفاد این صفحه را با دقت بررسی کنند.",
  },
  {
    title: "۲. شرایط استفاده از خدمات",
    content:
      "کاربر متعهد می‌شود اطلاعات صحیح و کامل در اختیار سامانه قرار دهد و از خدمات سایت تنها برای مقاصد قانونی استفاده کند. مسئولیت حفظ اطلاعات ورود به حساب کاربری بر عهده کاربر است.",
  },
  {
    title: "۳. حریم خصوصی",
    content:
      "اطلاعات کاربران صرفاً برای ارائه و بهبود خدمات استفاده می‌شود و جز در موارد الزام قانونی، بدون رضایت کاربر در اختیار اشخاص ثالث قرار نخواهد گرفت.",
  },
  {
    title: "۴. مسئولیت‌ها",
    content:
      "محتوای ارائه‌شده در سایت جنبه عمومی دارد و جایگزین مشاوره حقوقی متناسب با شرایط خاص هر پرونده نیست. دامنه مسئولیت طرفین در نسخه نهایی قوانین به‌صورت دقیق مشخص خواهد شد.",
  },
  {
    title: "۵. تغییر قوانین",
    content:
      "ممکن است این قوانین با توجه به تغییر خدمات یا الزامات قانونی به‌روزرسانی شوند. نسخه جدید از طریق همین صفحه در دسترس کاربران قرار می‌گیرد.",
  },
];

export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto py-8">
      <div className="card space-y-8">
        <header className="space-y-3 border-b border-gray-100 pb-6">
          <span className="text-4xl" aria-hidden="true">
            📜
          </span>
          <h1 className="text-3xl font-bold text-primary">قوانین و مقررات</h1>
          <p className="text-gray-500 leading-7">
            لطفاً پیش از ثبت‌نام و استفاده از خدمات عریضه نویس، موارد زیر را
            مطالعه کنید.
          </p>
        </header>

        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-lg font-bold text-primary">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-8 text-justify">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <p className="rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-800">
          توجه: متن این صفحه آزمایشی است و پیش از استفاده رسمی باید توسط مشاور
          حقوقی بررسی و با شرایط واقعی کسب‌وکار جایگزین شود.
        </p>
      </div>
    </section>
  );
}
