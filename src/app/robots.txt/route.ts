
export async function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}
