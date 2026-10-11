import Link from "next/link";
import { TbContract } from "react-icons/tb";
import { GoLaw } from "react-icons/go";
import { ImHammer2 } from "react-icons/im";
import { LuPhoneIncoming } from "react-icons/lu";
import AdminPresence from "@/components/AdminPresence";
import GuestSignInPrompt from "@/components/GuestSignInPrompt";

const services = [
  {
    slug: "ezharnameh",
    title: "اظهارنامه",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: <GoLaw />,
  },
  {
    slug: "gharardad",
    title: "قراردادنویسی",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: <TbContract />,
  },
  {
    slug: "moshavareh",
    title: "مشاوره",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: <LuPhoneIncoming />,
  },
  {
    slug: "layeheh",
    title: "لایحه",
    color: "bg-4service-btn hover:bg-primary-light hover:text-white",
    icon: <ImHammer2 />,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <AdminPresence />
      <section className="text-center space-y-4 py-5">
        <h1 className="text-2xl font-bold text-primary">
          {" "}
          برای دریافت خدمات حقوقی، یکی از گزینه‌های زیر را انتخاب کنید و درخواست
          خود را ثبت نمایید
        </h1>
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

      <GuestSignInPrompt />
    </div>
  );
}
