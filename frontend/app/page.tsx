import Link from "next/link";

const services = [
  {
    slug: "ezharnameh",
    title: "اظهارنامه",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: "📄",
  },
  {
    slug: "gharardad",
    title: "قراردادنویسی",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: "📝",
  },
  {
    slug: "moshavareh",
    title: "مشاوره",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: "💬",
  },
  {
    slug: "layeheh",
    title: "لایحه",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: "⚖️",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-primary">سرعت . دقت . تخصص</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          برای دریافت خدمات حقوقی، یکی از گزینه‌های زیر را انتخاب کنید و درخواست
          خود را ثبت نمایید.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className={`service-btn ${service.color}`}
          >
            <span className="text-4xl ml-3">{service.icon}</span>
            {service.title}
          </Link>
        ))}
      </section>

      <section className="text-center text-gray-500 text-sm">
        <p>
          برای ثبت درخواست باید{" "}
          <Link href="/login" className="text-primary-light underline">
            وارد
          </Link>{" "}
          حساب کاربری خود شوید یا{" "}
          <Link href="/register" className="text-primary-light underline">
            ثبت‌نام
          </Link>{" "}
          کنید.
        </p>
      </section>
    </div>
  );
}
