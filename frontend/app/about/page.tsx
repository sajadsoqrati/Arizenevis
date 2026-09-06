import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "درباره ما | عریضه نویس",
  description: "آشنایی با مجموعه عریضه نویس",
};

export default function AboutPage() {
  return (
    <section className="max-w-3xl mx-auto py-8">
      <div className="card space-y-6">
        <div className="space-y-2">
          <span className="text-4xl" aria-hidden="true">
            ⚖️
          </span>
          <h1 className="text-3xl font-bold text-primary">درباره ما</h1>
        </div>

        <div className="space-y-4 text-gray-600 leading-8 text-justify">
          <p>
            عریضه نویس یک مجموعه تخصصی در زمینه ارائه خدمات حقوقی است که با هدف
            ساده‌تر کردن دسترسی افراد و کسب‌وکارها به راهکارهای حقوقی شکل گرفته
            است. ما تلاش می‌کنیم با تکیه بر دانش و تجربه همکاران خود، خدماتی
            دقیق، سریع و قابل اعتماد ارائه دهیم.
          </p>
          <p>
            این متن به‌صورت آزمایشی در صفحه قرار گرفته است و می‌توانید بعداً
            تاریخچه شرکت، اهداف، ارزش‌ها و اعضای تیم خود را جایگزین آن کنید.
          </p>
        </div>
      </div>
    </section>
  );
}
