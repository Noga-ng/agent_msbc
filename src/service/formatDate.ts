
export default function formatDate(date: string): string {
  if (!date || Number.isNaN(new Date(date).getTime())) 
    return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
     day: "2-digit", 
     month: "short", 
     year: "numeric" 
    }).format(
        new Date(date)
    );
}