import Link from "next/link";
import Image from "next/image";
import {
  FaEnvelope,
  FaInstagram,
  FaPhone,
  FaTelegramPlane,
} from "react-icons/fa";
import type { IconType } from "react-icons";

const contactLinks: Array<{
  label: string;
  value: string;
  href: string;
  external: boolean;
  icon?: IconType;
  imageSrc?: string;
}> = [
  {
    label: "تلگرام",
    value: "@example",
    href: "https://t.me/example",
    external: true,
    icon: FaTelegramPlane,
  },
  {
    label: "اینستاگرام",
    value: "@example",
    href: "https://www.instagram.com/example",
    external: true,
    icon: FaInstagram,
  },
  {
    label: "روبیکا",
    value: "@example",
    href: "https://rubika.ir/example",
    external: true,
    imageSrc: "/rubika.png",
  },
  {
    label: "ایمیل",
    value: "info@example.com",
    href: "mailto:info@example.com",
    external: false,
    icon: FaEnvelope,
  },
  {
    label: "شماره تماس",
    value: "۰۲۱-۱۲۳۴۵۶۷۸",
    href: "tel:+982112345678",
    external: false,
    icon: FaPhone,
  },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-primary text-white m-3 rounded-xl">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-2 text-center md:text-right">
            <Link href="/" className="text-xl font-bold hover:text-accent">
              عریضه نویس
            </Link>
            <p className="text-sm leading-6 text-gray-300">
              راه‌های ارتباطی آزمایشی مجموعه؛ اطلاعات واقعی بعداً جایگزین خواهد
              شد.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
            {contactLinks.map((item) => (
              <li key={item.label} className="text-center">
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                  className="group flex flex-col items-center gap-1"
                >
                  {item.icon ? (
                    <item.icon
                      aria-hidden="true"
                      className="text-2xl transition-colors group-hover:text-accent"
                    />
                  ) : item.imageSrc ? (
                    <Image
                      src={item.imageSrc}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain transition-opacity group-hover:opacity-80"
                    />
                  ) : (
                    <span className="font-medium group-hover:text-accent">
                      {item.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-300" dir="ltr">
                    {item.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 border-t border-white/15 pt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} عریضه نویس — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
