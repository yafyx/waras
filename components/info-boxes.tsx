"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const infoItems = [
  {
    id: "privacy",
    title: "Privasi Terjamin",
    description: (
      <>
        Chat Anda{" "}
        <span className="text-blue-400 font-medium">tidak pernah</span> disimpan
        di server terpusat. Tanpa perlu membuat akun.
      </>
    ),
    icon: (
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 text-blue-400"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 0C5.23858 0 3 2.23858 3 5V7.12602C1.27477 7.57006 0 9.1362 0 11V16C0 18.2091 1.79086 20 4 20H12C14.2091 20 16 18.2091 16 16V11C16 9.1362 14.7252 7.57006 13 7.12602V5C13 2.23858 10.7614 0 8 0ZM11 7V5C11 3.34315 9.6569 2 8 2C6.3431 2 5 3.34315 5 5V7H11ZM8 11C8.5523 11 9 11.4477 9 12V15C9 15.5523 8.5523 16 8 16C7.4477 16 7 15.5523 7 15V12C7 11.4477 7.4477 11 8 11Z"
          fill="currentColor"
        ></path>
      </svg>
    ),
    iconBgClass: "bg-blue-500/10",
    cardHoverBorderClass: "hover:border-blue-500/20",
    cardHoverShadowClass: "hover:shadow-blue-500/5",
    gradientFromClass: "from-blue-500/10",
    gradientToClass: "to-purple-500/5",
    delay: 0.2,
  },
  {
    id: "speed",
    title: "Respon Cepat",
    description: (
      <>
        Respon cepat & akurat didukung{" "}
        <span className="text-green-400 font-medium">Google Generative AI</span>{" "}
        dengan sumber informasi dari{" "}
        <span className="text-green-400 font-medium">Alodokter</span>.
      </>
    ),
    icon: (
      <svg
        width="22"
        height="21"
        viewBox="0 0 22 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 text-green-400"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.632 1.50584C13.7331 0.315198 16.4486 -0.192862 20.0712 0.0658984C20.5674 0.101338 20.962 0.495999 20.9975 0.992109C21.2562 4.61481 20.7482 7.33024 19.5575 9.43138C18.4692 11.352 16.868 12.6574 15 13.6701V14.6836C15 15.8513 14.4897 16.9607 13.6032 17.7206L11.1508 19.8226C10.8984 20.039 10.5551 20.1157 10.2346 20.0275C9.91421 19.9393 9.65861 19.6977 9.55241 19.3828L9.55001 19.3759L9.54051 19.3483C9.53181 19.3232 9.51841 19.285 9.50051 19.235C9.46471 19.1349 9.41101 18.9881 9.34101 18.8058C9.20071 18.4403 8.99622 17.9357 8.7405 17.3805C8.21439 16.2384 7.52477 15.0024 6.7929 14.2705C6.06104 13.5386 4.82503 12.849 3.68288 12.3229C3.12771 12.0672 2.62311 11.8627 2.25764 11.7224C2.07526 11.6524 1.92844 11.5986 1.8284 11.5628C1.7784 11.5449 1.74016 11.5315 1.71507 11.5228L1.6875 11.5133L1.68146 11.5113C1.36657 11.4051 1.12407 11.1492 1.03587 10.8288C0.947662 10.5083 1.02444 10.165 1.24075 9.91258L3.34279 7.4602C4.10272 6.57361 5.21212 6.06336 6.37981 6.06336H7.39326C8.40599 4.19533 9.71131 2.5942 11.632 1.50584ZM14.5 8.56338C15.6046 8.56338 16.5 7.66793 16.5 6.56336C16.5 5.45879 15.6046 4.56336 14.5 4.56336C13.3954 4.56336 12.5 5.45879 12.5 6.56336C12.5 7.66793 13.3954 8.56338 14.5 8.56338Z"
          fill="currentColor"
        ></path>
        <path
          d="M4.20711 14.8564C4.59763 15.2469 4.59763 15.8801 4.20711 16.2706L1.70711 18.7706C1.31658 19.1611 0.683421 19.1611 0.292891 18.7706C-0.0976303 18.3801 -0.0976303 17.7469 0.292891 17.3564L2.79289 14.8564C3.18342 14.4659 3.81658 14.4659 4.20711 14.8564Z"
          fill="currentColor"
        ></path>
        <path
          d="M6.20711 18.2706C6.59763 17.8801 6.59763 17.2469 6.20711 16.8564C5.81658 16.4659 5.18342 16.4659 4.79289 16.8564L3.29289 18.3564C2.90237 18.7469 2.90237 19.3801 3.29289 19.7706C3.68342 20.1611 4.31658 20.1611 4.70711 19.7706L6.20711 18.2706Z"
          fill="currentColor"
        ></path>
      </svg>
    ),
    iconBgClass: "bg-green-500/10",
    cardHoverBorderClass: "hover:border-green-500/20",
    cardHoverShadowClass: "hover:shadow-green-500/5",
    gradientFromClass: "from-green-500/10",
    gradientToClass: "to-emerald-500/5",
    delay: 0.3,
  },
  {
    id: "focus",
    title: "Fokus Psikologi",
    description: (
      <>
        Dirancang khusus untuk menjawab pertanyaan seputar{" "}
        <span className="text-purple-400 font-medium">psikologi</span>.
      </>
    ),
    icon: (
      <svg
        width="18"
        height="20"
        viewBox="0 0 18 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 text-purple-400"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.79508 0C9.34738 0 9.79508 0.44772 9.79508 1V8.2675L16.0886 4.63397C16.5669 4.35783 17.1785 4.52171 17.4547 5C17.7308 5.47829 17.5669 6.08988 17.0886 6.36603L10.7948 9.9998L17.0893 13.634C17.5676 13.9101 17.7315 14.5217 17.4554 15C17.1792 15.4783 16.5676 15.6422 16.0893 15.366L9.79508 11.7321V19C9.79508 19.5523 9.34738 20 8.79508 20C8.24278 20 7.79508 19.5523 7.79508 19V11.7317L1.50017 15.366C1.02188 15.6422 0.410286 15.4783 0.134146 15C-0.142004 14.5217 0.0218757 13.9101 0.500166 13.634L6.79475 9.9998L0.500866 6.36603C0.0225657 6.08988 -0.141304 5.47829 0.134836 5C0.410976 4.52171 1.02257 4.35783 1.50087 4.63397L7.79508 8.2679V1C7.79508 0.44772 8.24278 0 8.79508 0Z"
          fill="currentColor"
        ></path>
      </svg>
    ),
    iconBgClass: "bg-purple-500/10",
    cardHoverBorderClass: "hover:border-purple-500/20",
    cardHoverShadowClass: "hover:shadow-purple-500/5",
    gradientFromClass: "from-purple-500/10",
    gradientToClass: "to-pink-500/5",
    delay: 0.4,
  },
];

export function InfoBoxes() {
  return (
    <>
      {/* Mobile View: Accordion */}
      <div className="md:hidden w-full">
        <BlurFade direction="up" delay={0.1}>
          <div className="mx-auto w-full max-w-md rounded-xl border border-neutral-800/80 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {infoItems.map((item) => (
                <BlurFade key={item.id} direction="up" delay={item.delay}>
                  <AccordionItem
                    value={item.id}
                    className="border-b border-neutral-800/50 last:border-b-0"
                  >
                    <AccordionTrigger className="hover:no-underline py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center justify-center p-2 rounded-lg",
                            item.iconBgClass
                          )}
                        >
                          {item.icon}
                        </div>
                        <span className="text-neutral-100">{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <div className="text-sm text-neutral-400">
                        {item.description}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </BlurFade>
              ))}
            </Accordion>
          </div>
        </BlurFade>
      </div>

      {/* Desktop View: Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-3 w-full">
        {infoItems.map((item) => (
          <BlurFade key={item.id} direction="up" delay={item.delay}>
            <Card
              className={cn(
                "group relative border border-neutral-800/80 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden transition-all duration-300 p-4 h-[160px] flex flex-col",
                item.cardHoverBorderClass,
                item.cardHoverShadowClass
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  item.gradientFromClass,
                  item.gradientToClass
                )}
              ></div>
              <div className="absolute -inset-1 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent_20%,black,transparent_80%)]"></div>
              <CardHeader className="p-0 relative z-10 space-y-0">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg",
                      item.iconBgClass
                    )}
                  >
                    {item.icon}
                  </div>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative z-10 md:block flex-grow flex items-center">
                <CardDescription className="text-sm text-neutral-400">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </BlurFade>
        ))}
      </div>
    </>
  );
}
