import { notify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProfileFields, useProfileForm } from "@/components/ProfileForm"

/** The Header owns the dialog; pages open it with this */
export const OPEN_EDIT_PROFILE_EVENT = "open-edit-profile"
export const openEditProfile = () =>
  window.dispatchEvent(new Event(OPEN_EDIT_PROFILE_EVENT))

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-130">
        {/* Mounted only while open, so the form starts from the current user each time */}
        <EditProfileForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function EditProfileForm({ onClose }: { onClose: () => void }) {
  const form = useProfileForm()

  const handleSave = async () => {
    if (await form.save()) {
      notify("Profile saved", "success")
      onClose()
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <ProfileFields form={form} />
      </DialogBody>

      <DialogFooter>
        <DialogCancel disabled={form.isSaving} />
        <Button onClick={handleSave} disabled={form.isSaving}>
          {form.isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </>
  )
}
