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

interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to System Design Challenger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {name}</Heading>
          <Text style={text}>
            You&apos;re in. Twice a day — a morning sketch and an evening full
            design — delivered to your inbox and ready on the web.
          </Text>
          <Text style={text}>
            Morning editions drop at 01:30 UTC. Evening editions at 13:30 UTC.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={appUrl}>
              Open System Design Challenger
            </Button>
          </Section>
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

export default WelcomeEmail;
