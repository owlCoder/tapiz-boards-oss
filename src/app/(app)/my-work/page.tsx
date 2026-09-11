import { boardService } from "@/application/board.service";
import { usersService } from "@/application/users.service";
import { requireUser } from "@/lib/guards";
import { MyWorkView } from "@/features/mywork/MyWorkView";

/** „Moji zadaci" — svi story-ji dodeljeni korisniku preko svih njegovih timova. */
export default async function MyWorkPage() {
  const user = await requireUser();
  const [items, profile] = await Promise.all([
    boardService.myWork(user.id),
    usersService.getById(user.id),
  ]);
  return <MyWorkView firstName={profile?.firstName ?? ""} items={items} />;
}
