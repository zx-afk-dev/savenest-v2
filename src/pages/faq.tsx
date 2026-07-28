import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { FAQSection, FAQ_ITEMS } from '@/components/home/FAQSection';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const FaqPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Pertanyaan Umum — ${SITE_NAME}`}
        description={`Jawaban atas pertanyaan yang paling sering diajukan tentang ${SITE_NAME}.`}
        path="/faq"
        jsonLd={[faqSchema(FAQ_ITEMS), breadcrumbSchema([{ name: 'FAQ', path: '/faq' }])]}
      />
      <div className="pt-6">
        <FAQSection />
      </div>
    </>
  );
};

export default FaqPage;
