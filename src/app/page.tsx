"use client";

import TabMenu from "@/components/header";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";

import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";

export default function Home() {
  const aboutRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tab: string) => {
    const sectionMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      Project: projectRef,
      "About me": aboutRef,
      Contact: contactRef,
    };

    const ref = sectionMap[tab];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [activeTab, setActiveTab] = useState<"featured" | "all">("featured");
  return (
    <>
      <Head>
        <title>Orero Ozore - Portfolio</title>
        <meta name="description" content="Software Engineer Portfolio" />
      </Head>
      <main className="relative w-full min-h-screen px-6 pt-5 md:pt-6 bg-black overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-b from-black via-[#128f8f33] to-black" />
        </div>

        <div className="relative z-10 ">
          <div className="mx-auto w-fit pb-5">
            <TabMenu onTabClick={handleTabClick} />
          </div>

          {/* Hero */}
          <section
            ref={aboutRef}
            className="grid content-center items-center text-center mt-16 md:mt-20 "
          >
            <button className="border-4 mx-auto   border-[#D9ECEC]  w-fit bg-white text-[#006666] text-sm px-4.5  rounded-full mb-6">
              Hey there, nice to meet you
            </button>
            <h1 className=" text-4xl md:text-6xl font-bold mb-4">
              I&apos;m Orero{" "}
              <span className="relative">
                Ozore
                <span className="absolute bg-yellow-300 grid content-center py-2 md:py-3 border h-fit px-2.5 md:px-4  text-black -inset-y-2 md:-inset-y-3 left-4 md:left-8 rounded-xl ">
                  z
                </span>
              </span>{" "}
              <span className="wave">👋</span>
            </h1>
            <h2 className="text-[#999999] tracking-wide text-lg">
              Software engineer
            </h2>

            {/* About Card */}
            <div
              className="px-3 pt-3 pb-14 bg-[#1D1D1D]   border-dashed border-[#6E6E6E99] mt-12 p-6 rounded-4xl mask-conic-to-red-300 mx-auto border  w-full max-w-2xl shadow-md"
              style={{ fontFamily: "var(--font-cabinet-grotesk)" }}
            >
              <div className="bg-[#2F2F2F] rounded-[20px] p-10">
                <div className=" gap-4">
                  <div className="text-left flex items-center gap-4">
                    <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-white">
                      <Image
                        src="/avatar.png"
                        alt="Orero Ozore"
                        width={60}
                        height={60}
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-medium text-lg">John Doe</h3>
                      <p className="text-[#999999] text-sm md:text-base">
                        Frontend & Backend
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-white mt-10 text-left text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur. Arcu quisque gravida
                  massa ridiculus vulputate metus orci nisi eget. Elit in
                  dictumst dictum nec.Lorem ipsum dolor sit amet. Elit in
                  dictumst dictum nec.Lorem ipsum dolor sit amet. Arcu quisque
                  gravida massa ridiculus vulputate metus orci nisi eget. Elit
                  in dictumst dictum nec.Lorem ipsum dolor sit amet. Arcu
                  quisque gravida massa ridiculus vulputate metus orci nisi
                  eget.
                </p>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="mt-16 text-center px-4">
            <h3 className="text-lg text-gray-400 mb-8">Skills</h3>
            <div className="flex flex-wrap justify-center gap-10">
              {["Layers", "Sisyphus", "Circooles", "Catalog", "Quot"].map(
                (skill) => (
                  <div key={skill} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xl">{skill[0]}</span>
                    </div>
                    <p className="mt-2 font-semibold">{skill}</p>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Projects */}
          <section
            ref={projectRef}
            className="mt-40 px-4 max-w-7xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-semibold mb-2">
              Projects
            </h2>
            <p className="text-[#999999] text-lg text-center md:text-xl mb-8">
              A few selected projects I&apos;ve had my hands on
            </p>

            <div className="flex justify-center tracking-wide text-sm md:text-base font-medium gap-3 mb-12">
              <button
                onClick={() => setActiveTab("featured")}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                  activeTab === "featured"
                    ? "bg-[#006666] text-white"
                    : "bg-[#1D1D1D] text-[#737373] hover:text-cyan-400"
                }`}
              >
                Featured projects
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                  activeTab === "all"
                    ? "bg-[#006666] text-white"
                    : "bg-[#1D1D1D] text-[#737373] hover:text-cyan-400"
                }`}
              >
                All projects
              </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 content-center w-fit mx-auto">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#1D1D1D] max-w-[291px] p-6 rounded-3xl text-left"
                >
                  <h4 className="text-lg font-semibold mb-5 ">Betacare</h4>
                  <div className="w-full relative h-40 bg-gray-700 mb-4 rounded-md">
                    <Image
                      className="rounded-md"
                      src="/placeholder.png"
                      fill
                      alt="project"
                    />
                  </div>

                  <p className="text-[#999999] text-sm">
                    Lorem ipsum dolor sit amet consectetur. Arcu quisque gravida
                    massa ridiculus vulputate metus orci nisi eget.
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section ref={contactRef} className="mt-40 text-center px-4">
            <h2 className="text-3xl md:text-4xl font-semibold  mb-4">
              Contact Me
            </h2>
            <p className="text-[#999999] text-lg text-center md:text-xl mb-12">
              Got a project we could work on together?
            </p>

            <div className="flex justify-center gap-6 mb-10">
              <a
                href="#"
                className="bg-[#B0D8D8] text-[#006666] p-4 rounded-full hover:bg-[#B0D8D8]/30"
              >
                <FaLinkedin size={30} />
              </a>
              <a
                href="#"
                className="bg-[#B0D8D8] p-4 text-[#006666] rounded-full hover:bg-[#B0D8D8]/30"
              >
                <FaEnvelope size={30} />
              </a>
              <a
                href="#"
                className="bg-[#B0D8D8] p-4 text-[#006666]  rounded-full hover:bg-[#B0D8D8]/30"
              >
                <FaGithub size={30} />
              </a>
            </div>
          </section>
        </div>
      </main>
      <footer className="text-[#999999] bg-[#141A1A] text-center text-sm py-8 border-t border-[#F0F0F080]">
        © 2025 Orero Ozore. Copyright.
      </footer>
    </>
  );
}
