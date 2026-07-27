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

interface EveningEditionEmailProps {
  name: string;
  title: string;
  challengeUrl: string;
}

export function EveningEditionEmail({
  name,
  title,
  challengeUrl,
}: EveningEditionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Evening design: {title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={label}>Evening Edition</Text>
          <Heading style={heading}>{title}</Heading>
          <Text style={text}>Good evening, {name}.</Text>
          <Text style={text}>
            Your full system design session is ready — requirements, high-level
            design, deep dive, and failure modes. Set aside 45–60 minutes.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={challengeUrl}>
              Open evening design
            </Button>
          </Section>
          <Text style={muted}>
            Submit when done to receive AI feedback and a reference outline.
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

export default EveningEditionEmail;
