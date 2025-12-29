export const metadata = {
  title: "My Vocab (FSRS)",
  description: "Simple spaced-repetition vocab app",
};

export default function RootLayout({
    
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}