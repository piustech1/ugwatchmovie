import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-primary/30 group-[.toaster]:bg-primary/10",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10",
          info: "group-[.toaster]:border-secondary/30 group-[.toaster]:bg-secondary/10",
        },
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 10px 40px -10px hsl(0 0% 0% / 0.5), 0 0 20px hsl(var(--primary) / 0.1)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
