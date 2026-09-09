import React from "react";
import LegalPageLayout, {
  Section,
  Paragraph,
  BulletList,
  CONTACT_EMAIL,
} from "./LegalPageLayout";

const LAST_UPDATED = "September 9, 2026";

export default function TermsOfServiceScreen() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <Paragraph>
        These Terms of Service ("Terms") govern your access to and use of
        Social Lift (the "Service"), a platform that lets you connect your
        social media accounts, generate AI-assisted posts, and publish or
        schedule content. By creating an account or using the Service, you
        agree to be bound by these Terms.
      </Paragraph>

      <Section heading="1. Acceptance of Terms">
        <Paragraph>
          By accessing or using Social Lift, you confirm that you can form
          a binding contract and that you accept these Terms and our
          Privacy Policy. If you do not agree, please do not use the
          Service.
        </Paragraph>
      </Section>

      <Section heading="2. Description of Service">
        <Paragraph>
          Social Lift allows you to connect third-party social media
          accounts, generate post content using AI, and publish or schedule
          that content to your connected accounts. Features may change over
          time as we improve the Service.
        </Paragraph>
      </Section>

      <Section heading="3. Account Registration">
        <Paragraph>
          You must provide accurate information when creating an account
          and keep your login credentials secure. You are responsible for
          all activity that occurs under your account.
        </Paragraph>
      </Section>

      <Section heading="4. Connected Social Accounts">
        <Paragraph>
          When you connect a social media account, you authorize Social
          Lift to access that account, via the platform's official API,
          solely to publish or schedule content that you create or approve.
          You are responsible for complying with each connected platform's
          own terms of service. You may disconnect a social account at any
          time in your account settings.
        </Paragraph>
      </Section>

      <Section heading="5. Acceptable Use">
        <Paragraph>You agree not to use Social Lift to:</Paragraph>
        <BulletList
          items={[
            "Generate or publish content that is unlawful, defamatory, harassing, hateful, or infringes on the rights of others.",
            "Impersonate any person or entity, or misrepresent your affiliation with one.",
            "Distribute spam, malware, or engage in any activity that disrupts or harms the Service or connected platforms.",
            "Attempt to gain unauthorized access to other accounts, systems, or data.",
            "Use the Service in violation of any applicable law or the terms of any connected social media platform.",
          ]}
        />
      </Section>

      <Section heading="6. Content and AI-Generated Posts">
        <Paragraph>
          You retain ownership of the content you create and publish
          through Social Lift, including AI-assisted drafts you choose to
          use. You are solely responsible for reviewing and approving any
          AI-generated content before it is published or scheduled, and for
          ensuring it complies with applicable laws and platform policies.
          Social Lift does not guarantee the accuracy, originality, or
          suitability of AI-generated content.
        </Paragraph>
      </Section>

      <Section heading="7. Account Termination">
        <Paragraph>
          You may stop using the Service and delete your account at any
          time. We may suspend or terminate your account if you violate
          these Terms, misuse the Service, or if required by law. Upon
          termination, your right to use the Service ends immediately, and
          we will handle your data as described in our Privacy Policy.
        </Paragraph>
      </Section>

      <Section heading="8. Disclaimer of Warranties">
        <Paragraph>
          The Service is provided "as is" and "as available" without
          warranties of any kind, express or implied, including
          warranties of merchantability, fitness for a particular purpose,
          or non-infringement. We do not guarantee that the Service will
          be uninterrupted, error-free, or that any connected social
          platform will accept or perform as expected with published
          content.
        </Paragraph>
      </Section>

      <Section heading="9. Limitation of Liability">
        <Paragraph>
          To the fullest extent permitted by law, Social Lift and its
          team shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits,
          data, or goodwill, arising from your use of or inability to use
          the Service, including any actions taken on connected social
          media accounts.
        </Paragraph>
      </Section>

      <Section heading="10. Changes to These Terms">
        <Paragraph>
          We may update these Terms from time to time. If we make material
          changes, we will update the "Last updated" date above and, where
          appropriate, notify you through the app or by email. Continued
          use of the Service after changes take effect constitutes
          acceptance of the revised Terms.
        </Paragraph>
      </Section>

      <Section heading="11. Contact Us">
        <Paragraph>
          If you have any questions about these Terms, please contact us
          at {CONTACT_EMAIL}.
        </Paragraph>
      </Section>
    </LegalPageLayout>
  );
}
