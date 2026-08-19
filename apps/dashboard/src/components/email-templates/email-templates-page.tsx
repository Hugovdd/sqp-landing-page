import { IconAlertTriangle, IconMail } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AltarEmailPreviewsResult,
  AltarEmailTemplate,
} from "@/lib/altar-email";

const STATUS_COPY = {
  missing_config: {
    title: "Altar email previews are not configured",
    body: "ALTAR_ADMIN_TOKEN is not set. The dashboard cannot request live template previews.",
  },
  unauthorized: {
    title: "Not authorized to load email previews",
    body: "The waitlist Worker rejected the admin token.",
  },
  unavailable: {
    title: "Altar email previews are unavailable",
    body: "The waitlist preview endpoint could not be reached. Try again shortly.",
  },
  malformed: {
    title: "Email preview response is malformed",
    body: "The waitlist Worker returned a payload that did not match the expected preview schema.",
  },
  empty: {
    title: "No email templates were returned",
    body: "The preview endpoint succeeded and returned an empty template list.",
  },
} as const;

function StatusCard({
  status,
}: {
  status: Exclude<AltarEmailPreviewsResult["status"], "ready">;
}) {
  const copy = STATUS_COPY[status];
  const failed = status !== "empty";
  return (
    <Card className={failed ? "border-destructive/40" : undefined}>
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        {failed ? (
          <IconAlertTriangle className="text-destructive size-8" />
        ) : (
          <IconMail className="size-8" />
        )}
        <div>
          <h3 className={failed ? "font-semibold" : "font-medium"}>
            {copy.title}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-lg text-sm">
            {copy.body}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatePreview({ template }: { template: AltarEmailTemplate }) {
  if (!template.ok) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>{template.name}</span>
            <Badge variant="destructive">Render failed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">This template failed to render</p>
          {template.trigger ? (
            <p className="text-muted-foreground text-sm">{template.trigger}</p>
          ) : null}
          <p className="text-destructive text-sm">{template.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>{template.name}</span>
          <Badge variant="secondary">{template.id}</Badge>
        </CardTitle>
        <p className="text-muted-foreground text-sm">{template.trigger}</p>
        <p className="text-sm">
          <span className="text-muted-foreground">Subject: </span>
          {template.subject}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <section className="min-w-0">
          <h3 className="mb-2 text-sm font-medium">HTML</h3>
          <iframe
            title={`HTML preview of ${template.name}`}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={template.html}
            className="bg-background h-[32rem] w-full rounded-md border"
          />
        </section>
        <section className="min-w-0">
          <h3 className="mb-2 text-sm font-medium">Plain text</h3>
          <pre className="bg-muted/40 h-[32rem] overflow-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
            {template.text}
          </pre>
        </section>
      </CardContent>
    </Card>
  );
}

function TemplateGallery({
  templates,
  selectedId,
}: {
  templates: [AltarEmailTemplate, ...AltarEmailTemplate[]];
  selectedId?: string;
}) {
  const selected =
    templates.find((template) => template.id === selectedId) ?? templates[0];
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.4fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {templates.map((template) => {
            const isSelected = selected.id === template.id;
            const query = new URLSearchParams({
              product: "altar",
              template: template.id,
            });
            return (
              <a
                key={template.id}
                href={`/email-templates?${query.toString()}`}
                aria-current={isSelected ? "page" : undefined}
                className={
                  isSelected
                    ? "bg-muted rounded-md border p-3"
                    : "hover:bg-muted/40 rounded-md border p-3"
                }
              >
                <p className="font-medium">{template.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {template.trigger || "Trigger unavailable"}
                </p>
                <p className="mt-1 text-sm">
                  {template.ok ? template.subject : "Render failed"}
                </p>
              </a>
            );
          })}
        </CardContent>
      </Card>

      <TemplatePreview template={selected} />
    </div>
  );
}

export function EmailTemplatesPageView({
  result,
  selectedId,
}: {
  result: AltarEmailPreviewsResult;
  selectedId?: string;
}) {
  return (
    <main id="main-content" className="flex flex-col gap-5 p-4 sm:p-6">
      <div>
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <p className="text-muted-foreground text-sm">
          Live production Altar templates from the waitlist Worker. Preview is
          read-only.
        </p>
      </div>

      {result.status === "ready" ? (
        <TemplateGallery templates={result.templates} selectedId={selectedId} />
      ) : (
        <StatusCard status={result.status} />
      )}
    </main>
  );
}
