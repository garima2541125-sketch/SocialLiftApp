import React from "react";
import LegalPageLayout, {
  Section,
  Paragraph,
  BulletList,
  CONTACT_EMAIL,
} from "./LegalPageLayout";

const LAST_UPDATED = "September 9, 2026";

export default function PrivacyPolicyScreen() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <Paragraph>
        Social Lift ("Social Lift", "we", "us", or "our") provides a
        platform that lets you connect your social media accounts, generate
        AI-assisted posts, and publish or schedule content across those
        accounts. This Privacy Policy explains what information we collect,
        how we use it, and the choices you have.
      </Paragraph>
      <Paragraph>
        By creating an account or using Social Lift, you agree to the
        collection and use of information as described in this policy.
      </Paragraph>

      <Section heading="1. Information We Collect">
        <Paragraph>We collect the following categories of information:</Paragraph>
        <BulletList
          items={[
            "Account information — name, email address, password (or authentication token if you sign in with Google), and profile details you provide.",
            "Connected social media tokens — when you link a social media account (e.g. Instagram, LinkedIn, X/Twitter), we store the access tokens and related credentials needed to publish or schedule content on your behalf. We do not store your social media passwords.",
            "Content and generated posts — prompts you submit, AI-generated drafts, media you upload, and posts you schedule or publish through Social Lift.",
            "Usage data — pages visited, features used, device and browser type, IP address, and log data collected automatically to help us operate and improve the service.",
          ]}
        />
      </Section>

      <Section heading="2. How We Use Your Information">
        <Paragraph>We use the information we collect to:</Paragraph>
        <BulletList
          items={[
            "Provide, operate, and maintain the Social Lift service.",
            "Generate AI-assisted post content based on your prompts and brand preferences.",
            "Publish or schedule content to your connected social media accounts, only as and when you direct us to.",
            "Authenticate your account and keep it secure.",
            "Monitor, troubleshoot, and improve the performance and reliability of the service.",
            "Communicate with you about your account, updates, or support requests.",
          ]}
        />
      </Section>

      <Section heading="3. Third-Party Services">
        <Paragraph>
          Social Lift relies on third-party services to operate, including:
        </Paragraph>
        <BulletList
          items={[
            "Google Sign-In and Firebase Authentication — used to let you create an account and sign in securely.",
            "Firebase (Google) — used for backend data storage and infrastructure.",
            "Connected social media platforms (such as Instagram, LinkedIn, and X/Twitter) — used, with your authorization, to publish or schedule content on your behalf via their official APIs.",
          ]}
        />
        <Paragraph>
          These third parties process data in accordance with their own
          privacy policies. We only share the minimum information necessary
          for these integrations to function, and only with your consent
          when connecting an account.
        </Paragraph>
      </Section>

      <Section heading="4. Data Retention and Deletion">
        <Paragraph>
          We retain your account information and connected account tokens
          for as long as your account remains active, or as needed to
          provide the service. If you disconnect a social media account, we
          delete the associated access tokens. If you delete your account,
          we will delete or anonymize your personal data within a reasonable
          period, except where we are required to retain it for legal,
          security, or fraud-prevention purposes.
        </Paragraph>
        <Paragraph>
          You may request deletion of your account and associated data at
          any time by contacting us at {CONTACT_EMAIL}.
        </Paragraph>
      </Section>

      <Section heading="5. Data Security">
        <Paragraph>
          We use industry-standard safeguards, including encrypted storage
          and transmission, to protect your information. However, no method
          of transmission or storage is completely secure, and we cannot
          guarantee absolute security.
        </Paragraph>
      </Section>

      <Section heading="6. Your Rights and Choices">
        <Paragraph>
          Depending on your location, you may have the right to access,
          correct, export, or delete your personal information, and to
          withdraw consent for connected social accounts at any time by
          disconnecting them in your account settings. To exercise any of
          these rights, contact us at {CONTACT_EMAIL}.
        </Paragraph>
      </Section>

      <Section heading="7. Children's Privacy">
        <Paragraph>
          Social Lift is not directed to individuals under the age of 16,
          and we do not knowingly collect personal information from
          children. If you believe a child has provided us with personal
          information, please contact us so we can remove it.
        </Paragraph>
      </Section>

      <Section heading="8. Changes to This Policy">
        <Paragraph>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will update the "Last updated" date above
          and, where appropriate, notify you through the app or by email.
        </Paragraph>
      </Section>

      <Section heading="9. Contact Us">
        <Paragraph>
          If you have any questions about this Privacy Policy or how we
          handle your data, please contact us at {CONTACT_EMAIL}.
        </Paragraph>
      </Section>
    </LegalPageLayout>
  );
}
