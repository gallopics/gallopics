import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"

import "./index.css"

import { Toaster } from "@/components/ui/toast"

import App from "./App.tsx"

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations.map((registration) => registration.unregister())
  )
}

unregisterServiceWorkers().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <Toaster>
            <App />
          </Toaster>
        </ClerkProvider>
      ) : (
        <div className="p-6">Missing `VITE_CLERK_PUBLISHABLE_KEY`.</div>
      )}
    </StrictMode>
  )
})
