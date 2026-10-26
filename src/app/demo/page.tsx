import DemoApp from "@/features/demo/DemoApp";
import "@/features/demo/demo.css";

export const metadata = {
  title: "Demo bez logina | Tapiz Boards OSS",
  description: "Tapiz Boards Kanban i sprint demo sa čuvanjem podataka u browseru, bez naloga i baze.",
};

export default function DemoPage() {
  return <DemoApp />;
}
