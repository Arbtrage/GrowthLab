import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MorningEditionEmailProps {
  name: string;
  title: string;
  challengeUrl: string;
}

export function MorningEditionEmail({
  name,
  title,
  challengeUrl,
}: MorningEditionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Morning sketch: {title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={label}>Morning Edition</Text>
          <Heading style={heading}>{title}</Heading>
          <Text style={text}>Good morning, {name}.</Text>
          <Text style={text}>
            Your 15-minute warm-up is ready — clarifying questions, back-of-envelope
            estimates, and a quick trade-off.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={challengeUrl}>
              Open morning sketch
            </Button>
          </Section>
          <Text style={muted}>
            The evening full design on this topic drops at 13:30 UTC.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const label = {
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  color: "#71717a",
  margin: "0 0 8px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#52525b",
};

const muted = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#a1a1aa",
  marginTop: "24px",
};

const buttonContainer = {
  marginTop: "24px",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

export default MorningEditionEmail;
