"use client";

import NexaNavbar from "./NexaNavbar";
import NexaHero from "./NexaHero";
import NexaAbout from "./NexaAbout";
import NexaDoors from "./NexaDoors";
import NexaFooter from "./NexaFooter";
import { montserrat, poppins } from "./fonts";

export default function NexaLanding() {
  return (
    <div
      className={`${montserrat.variable} ${poppins.variable} min-h-screen bg-[#1A1B1B] text-[#EDEDED] selection:bg-[#BFF137] selection:text-[#1A1B1B] flex flex-col`}
    >
      <NexaNavbar />
      <main className="flex-1">
        <NexaHero />
        <NexaAbout />
        <NexaDoors />
      </main>
      <NexaFooter />
    </div>
  );
}
