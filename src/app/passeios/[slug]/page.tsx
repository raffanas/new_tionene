import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourHero from "@/components/tour-detail/TourHero";
import TourGallery from "@/components/tour-detail/TourGallery";
import TourOverview from "@/components/tour-detail/TourOverview";
import TourItinerary from "@/components/tour-detail/TourItinerary";
import TourIncludes from "@/components/tour-detail/TourIncludes";
import TourPracticalInfo from "@/components/tour-detail/TourPracticalInfo";
import TourBookingBox from "@/components/tour-detail/TourBookingBox";
import TourRelated from "@/components/tour-detail/TourRelated";
import TourCTA from "@/components/tour-detail/TourCTA";
import { getTourBySlug, getAllTours } from "@/data/tours";

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tours = getAllTours();
  return tours.map((tour) => ({
    slug: tour.slug,
  }));
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    return {
      title: "Passeio não encontrado | Tio Nenê",
      description: "O passeio solicitado não foi encontrado em nosso catálogo.",
    };
  }

  return {
    title: `${tour.name} | Passeios Tio Nenê Cancún`,
    description: tour.shortDescription,
    openGraph: {
      title: `${tour.name} | Tio Nenê Cancún`,
      description: tour.shortDescription,
      images: [{ url: tour.heroImage }],
    },
  };
}

export default async function TourDetailPage({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  return (
    <div className="tour-detail-page">
      {/* Header global do projeto */}
      <Header currentPage="passeios" />

      <main className="tour-detail-main">
        {/* 1. HERO DO PASSEIO */}
        <TourHero tour={tour} />

        {/* 2. GALERIA */}
        <TourGallery tour={tour} />

        {/* 3. SOBRE O PASSEIO */}
        <TourOverview tour={tour} />

        {/* 4. ROTEIRO / O QUE VOCÊ VAI VIVER */}
        <TourItinerary tour={tour} />

        {/* 5. INCLUI / NÃO INCLUI */}
        <TourIncludes tour={tour} />

        {/* 6. INFORMAÇÕES PRÁTICAS */}
        <TourPracticalInfo tour={tour} />

        {/* 7. PREÇO + CONTRATAÇÃO */}
        <section id="reserva" className="tour-detail-booking-section">
          <div className="tour-detail-container">
            <div className="tour-detail-booking-section__wrapper">
              <TourBookingBox tour={tour} />
            </div>
          </div>
        </section>

        {/* 8. PASSEIOS RELACIONADOS */}
        <TourRelated currentTour={tour} />

        {/* 9. CTA FINAL */}
        <TourCTA tour={tour} />
      </main>

      {/* 10. FOOTER GLOBAL */}
      <Footer />
    </div>
  );
}
