import { GlobalAssistant } from '@/components/global-assistant'

export const metadata = { title: 'Assistente AI' }

export default function AssistentePage() {
  return (
    <div className="container max-w-3xl space-y-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Assistente AI</h1>
        <p className="text-muted-foreground">
          Chiedi qualsiasi cosa sui bandi: ammissibilità, documenti, checklist, bozze di progetto.
        </p>
      </div>
      <GlobalAssistant />
    </div>
  )
}
