import { useDropzone } from "react-dropzone";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePictureDropzoneProps {
  formik: any;
  uploadedImage: string;
}

export function ProfilePictureDropzone({ formik , uploadedImage }: ProfilePictureDropzoneProps) {
    console.log('uploadedImage', uploadedImage)
  const [preview, setPreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles:any) => {
      const file = acceptedFiles[0];
      if (file) {
        formik.setFieldValue("profilePicture", file);
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const removeImage = () => {
    formik.setFieldValue("profilePicture", null);
    setPreview(null);
  };

  return (
    <div className="col-span-full space-y-2 w-full">
      <Label className="text-sm font-medium">Profile Picture</Label>

      <Card
        {...getRootProps()}
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center flex-col text-center px-4 py-6 cursor-pointer transition hover:bg-muted/50",
          isDragActive ? "border-primary bg-muted" : "border-muted"
        )}
      >
        <input {...getInputProps()} name="profilePicture" />

        {preview || uploadedImage ? (
          <div className="relative">
            <img
              src={preview || uploadedImage}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-full border shadow"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to upload
            </p>
          </>
        )}
      </Card>

      {formik.touched.profilePicture && formik.errors.profilePicture && (
        <p className="text-sm text-red-500">{formik.errors.profilePicture}</p>
      )}
    </div>
  );
}
