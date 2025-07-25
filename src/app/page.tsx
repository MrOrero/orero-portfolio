"use client";

import TabMenu from "@/components/header";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";

export default function Home() {
  const aboutRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const skillsContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"featured" | "all">("featured");
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  // Auto-scroll functionality for skills
  useEffect(() => {
    const container = skillsContainerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;
    let userScrollTimeout: NodeJS.Timeout;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (!isManualScrolling && container) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          const currentScroll = container.scrollLeft;

          // Smooth scroll to the right
          if (currentScroll >= maxScroll) {
            // Reset to beginning with smooth transition
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            // Continue scrolling right
            container.scrollBy({ left: 120, behavior: "smooth" });
          }
        }
      }, 2000); // Scroll every 2 seconds
    };

    const handleUserScroll = () => {
      setIsManualScrolling(true);
      clearTimeout(userScrollTimeout);

      // Resume auto-scroll after 3 seconds of no user interaction
      userScrollTimeout = setTimeout(() => {
        setIsManualScrolling(false);
      }, 3000);
    };

    // Only auto-scroll on mobile/tablet screens
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    if (mediaQuery.matches) {
      startAutoScroll();
      container.addEventListener("scroll", handleUserScroll);
      container.addEventListener("touchstart", handleUserScroll);
    }

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(userScrollTimeout);
      if (container) {
        container.removeEventListener("scroll", handleUserScroll);
        container.removeEventListener("touchstart", handleUserScroll);
      }
    };
  }, [isManualScrolling]);

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
  return (
    <>
      <main className="relative w-full min-h-screen   bg-black ">
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-b from-black via-[#128f8f33] to-black" />
        </div>
        <div className="sticky top-0 pt-5 md:pt-6 z-50 mt-4 mx-auto w-fit pb-5">
          <TabMenu onTabClick={handleTabClick} />
        </div>

        <div className="relative z-10 ">
          {/* Hero */}
          <section
            ref={aboutRef}
            className="grid content-center px-6 items-center text-center mt-16 md:mt-20 "
          >
            <button className="border-4 mx-auto   border-[#D9ECEC]  w-fit bg-white text-[#006666] text-sm px-4.5  rounded-full mb-6">
              Hey there, nice to meet you
            </button>
            <div className="relative flex flex-wrap justify-center items-center gap-3 m-auto text-4xl md:text-6xl font-bold mb-4 text-white">
              I&apos;m Orero
              <span className="inline-flex items-center gap-1 relative">
                <span className="text-white -mr-3 md:-mr-4">O</span>
                <span className="bg-yellow-300 z-50 text-black border px-2.5 py-1 rounded-xl text-4xl md:text-6xl font-bold leading-none">
                  z
                </span>
                <span className="text-white -ml-3.5 md:-ml-5">ore</span>
              </span>
              <span className="wave">👋</span>
            </div>

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
                        src="/profile-picture.jpg"
                        alt="Orero Ozore"
                        width={60}
                        height={60}
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-medium text-lg text-white">
                        Orero Ozore
                      </h3>
                      <p className="text-[#999999] text-sm md:text-base">
                        Software Engineer
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-white mt-10 text-left text-sm leading-relaxed">
                  Senior Software Engineer with experience across multiple
                  industries including Web3, AI, Fintech, Telecommunication, and
                  Manufacturing industries. Skilled in leading cross-functional
                  teams to deliver high-quality software solutions. A highly
                  motivated self-starter with excellent problem-solving
                  abilities who thrives in fast-paced environments. Committed to
                  delivering results that exceed expectations. Strong
                  communicator and team player able to collaborate effectively
                  across departments.
                </p>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="mt-16 text-center relative z-10">
            <h3 className="text-lg text-gray-400 mb-8 px-6">Skills</h3>
            <div ref={skillsContainerRef} className="skills-scroll-container">
              <div className="skills-track">
                {[
                  { name: "TypeScript", logo: "/logos/typescript.png" },
                  { name: "Java", logo: "/logos/java.png" },
                  { name: "Angular", logo: "/logos/angular.png" },
                  { name: "React", logo: "/logos/react.png" },
                  { name: "NestJS", logo: "/logos/nest.jpg", className: "skill-icon-white" },
                  { name: "Express", logo: "/logos/express.png", imageClass: "bg-white", className: "skill-icon-white" },
                  { name: "Spring Boot", logo: "/logos/springboot.png" },
                  { name: "AWS", logo: "/logos/aws.png", className: "skill-icon-white" },
                ].map((skill, index) => (
                  <div key={`${skill.name}-${index}`} className="skill-item">
                    <div className={`skill-icon ${skill.className}`}>
                      <Image
                        src={skill.logo}
                        alt={skill.name}
                        width={50}
                        height={50}
                        className={`object-contain ${skill.imageClass || ""}`}
                      />
                    </div>
                    <p className="mt-2 font-medium text-sm text-white">
                      {skill.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Projects */}
          <section
            ref={projectRef}
            className="mt-40 px-4 max-w-7xl mx-auto  text-center"
          >
            <h2 className="text-3xl text-white md:text-4xl font-semibold mb-2">
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
            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 content-center w-fit mx-auto">
              {[
                {
                  title: "SIMROP",
                  description:
                    "SIM Registration and Operations Portal for MTN Nigeria",
                  image: "/projects/simrop.png",
                  link: "https://sraa.mtnnigeria.net/simrop/",
                },
                {
                  title: "Kachasi",
                  description: "Trade finance software application built to automate the full lifecycle of international and local trade finance operations",
                  image: "/projects/kachasi.png",
                  link: "https://unionsystems.com/products/kachasi/",
                },
                {
                  title: "Arca Money",
                  description: "Agency Banking Platform that enables registered agents to process financial transactions for customers, making banking products more accessible.",
                  image: "/projects/arca.png",
                  link: "https://arca.network/agents",
                },
                {
                  title: "AV Card",
                  description: "Virtual card platform for online transactions",
                  image: "/projects/avcard.png",
                  link: "https://avcard.io/",
                },
                {
                  title: "GiveBack",
                  description:
                    `A social responsibility platform that connect and integrate all social responsibility stakeholders to 
                    allow transparent opportunity for worldwide sponsors to support local projects. `,
                  image: "/projects/giveback.png",
                  link: "https://givebackng.org/",
                },
                {
                  title: "Contract Collab",
                  description: "An Inhouse Contract Management Sytem for ABInBev(in use in over 10 countries), It provides all tools needed in the contract lifecyle, from conception to finalizing and signing a contract",
                  image: "/projects/contract.png",
                  link: "https://contractscolab.com",
                },
                {
                  title: "SpotPay",
                  description: "Inhouse payment platform for ABInBev, enabling seamless and accurate payments for ABInBev transporters and distributors across Africa.",
                  image: "/projects/spotpay.png",
                  link: "https://tpayments.abispotlight.com/",
                },
                {
                  title: "Influx AI",
                  description: "AI-powered Web3 token security and analytics platform",
                  image: "/projects/influx.png",
                  link: "https://app.influxai.io/",
                },
                {
                  title: "Betacare",
                  description: "Healthcare service platform",
                  image: "/projects/betacare.png",
                  link: "https://betacare.ng",
                },
                {
                  title: "LearnBeta",
                  description: "Educational technology platform",
                  image: "/projects/learnbeta.png",
                  link: "https://learnbeta.ng",
                },
                {
                  title: "BetaPlay",
                  description: "Entertainment and gaming platform",
                  image: "/projects/betaplay.png",
                  link: "https://betaplay.ng",
                },
                {
                  title: "ESPN Superbowl VIP",
                  description: "Event page for ESPN Superbowl VIP experience",
                  image: "/projects/espn.png",
                  link: "https://espnvip.brightspotapps.com/",
                },
                {
                  title: "THE MATCH: SUPERSTARS",
                  description: "Event registration for THE MATCH: SUPERSTARS by Capital One",
                  image: "/projects/match.png",
                  link: "https://thematch.brightspotapps.com/",
                },
                {
                  title: "Onboarder",
                  description: "Streamlined onboarding solution",
                  image: "/projects/onboarding.png",
                  link: "https://onboarder-untitled.netlify.app/",
                },
                {
                  title: "Knowledge Up",
                  description: "Educational platform for skill development",
                  image: "/projects/knowledgeup.png",
                  link: "https://knowledgeup.netlify.app/",
                },
                {
                  title: "MySirigu",
                  description: "Social networking mobile application for crowdfunding and wishlisting",
                  image: "/projects/mysirigu.png",
                  link: "https://onelink.to/4vpnag",
                },              ]
                .filter((project) =>
                  activeTab === "featured"
                    ? [
                        "ESPN Superbowl VIP",
                        "THE MATCH: SUPERSTARS",
                        "SIMROP",
                        "Influx AI",
                        "AV Card",
                      ].includes(project.title)
                    : true
                )
                .sort((a, b) => {
                  if (activeTab === "featured") {
                    const featuredOrder = [
                      "ESPN Superbowl VIP",
                      "SIMROP",
                      "Influx AI",
                      "AV Card",
                      "THE MATCH: SUPERSTARS",
                    ];
                    return featuredOrder.indexOf(a.title) - featuredOrder.indexOf(b.title);
                  }
                  return 0;
                })                
                .map((project, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1D1D1D] max-w-[291px] p-6 rounded-3xl text-left flex flex-col h-full"
                  >
                    <h4 className="text-lg text-white font-semibold mb-5">
                      {project.title}
                    </h4>
                    <div className="w-full relative h-40 bg-gray-700 mb-4 rounded-md overflow-hidden">
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          className="rounded-md object-cover hover:scale-105 transition-transform duration-300"
                          src={project.image}
                          fill
                          alt={project.title}
                        />
                      </a>
                    </div>
                    <p className="text-[#999999] text-sm mb-4 flex-grow">
                      {project.description}
                    </p>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-cyan-400 text-sm hover:text-white transition-colors duration-200 mt-auto"
                    >
                      View Project →
                    </a>
                  </div>
                ))}
            </div>
          </section>

          {/* Contact */}
          <section ref={contactRef} className="mt-40 text-center px-4">
            <h2 className="text-3xl md:text-4xl text-white font-semibold  mb-4">
              Contact Me
            </h2>
            <p className="text-[#999999] text-lg text-center md:text-xl mb-12">
              Got a project we could work on together?
            </p>

            <div className="flex justify-center gap-6 pb-10">
              <a
                href="http://www.linkedin.com/in/orero-ozore-b62137249"
                target="_blank"
                className="bg-[#B0D8D8] text-[#006666] p-4 rounded-full hover:bg-[#B0D8D8]/30"
              >
                <FaLinkedin size={30} />
              </a>
              <a
                href="mailto:oreroozore@gmail.com"
                className="bg-[#B0D8D8] p-4 text-[#006666] rounded-full hover:bg-[#B0D8D8]/30"
              >
                <FaEnvelope size={30} />
              </a>
              <a
                href="https://github.com/MrOrero"
                target="_blank"
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
