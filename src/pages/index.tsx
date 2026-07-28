import type { GetServerSideProps, NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { Hero } from '@/components/home/Hero';
import { SupportedPlatforms } from '@/components/home/SupportedPlatforms';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FAQSection, FAQ_ITEMS } from '@/components/home/FAQSection';
import { GlobalStats } from '@/components/home/GlobalStats';
import { QuotaExhausted } from '@/components/home/QuotaExhausted';
import { getGlobalStats } from '@/lib/store/globalQuota';
import { faqSchema, organizationSchema, softwareApplicationSchema, websiteSchema } from '@/lib/seo';

interface HomeProps {
  quotaExhausted: boolean;
  resetsAt: string;
}

const HomePage: NextPage<HomeProps> = ({ quotaExhausted, resetsAt }) => {
  return (
    <>
      <SEO
        title="SaveNest — Download Video TikTok, Instagram & YouTube Tanpa Watermark"
        description="SaveNest adalah downloader video modern untuk TikTok, Instagram, dan YouTube. Tempel URL, pilih kualitas, unduh langsung tanpa watermark."
        path="/"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqSchema(FAQ_ITEMS),
        ]}
      />

      {quotaExhausted ? (
        <QuotaExhausted resetsAt={resetsAt} />
      ) : (
        <>
          <Hero />
          <SupportedPlatforms />
          <HowItWorks />
          <FAQSection />
          <GlobalStats />
        </>
      )}
    </>
  );
};

// Server-rendered (rather than statically generated / ISR) specifically so
// the "quota habis" maintenance view can be decided before the page ever
// reaches the browser, per the brief's requirement. Every other route in
// this project is static/ISR-eligible; only this one needs per-request data.
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const stats = await getGlobalStats();
  return {
    props: {
      quotaExhausted: stats.remaining <= 0,
      resetsAt: stats.resetsAt,
    },
  };
};

export default HomePage;
