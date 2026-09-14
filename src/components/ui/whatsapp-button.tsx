import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function WhatsAppButton({
  message,
  phone,
  children = "WhatsApp",
  size = "md",
  className,
}: {
  message: string;
  phone?: string;
  children?: React.ReactNode;
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <a
      href={buildWhatsAppLink(message, phone)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: "whatsapp", size }), className)}
    >
      <MessageCircle className="h-4 w-4" />
      {children}
    </a>
  );
}
