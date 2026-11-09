import { notify } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import {
  createDialogHandle,
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProfileFields, useProfileForm } from "@/components/ProfileForm"

/** Opens Edit profile from anywhere: `<DialogTrigger handle={editProfileDialog}>` */
export const editProfileDialog = createDialogHandle()

/** Rendered once in App */
export function EditProfileModal() {
  return (
    <Dialog handle={editProfileDialog}>
      <DialogContent className="sm:max-w-130">
        {/* Mounted only while open, so the form starts from the current user each time */}
        <EditProfileForm onClose={() => editProfileDialog.close()} />
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
