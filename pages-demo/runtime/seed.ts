import type { LocalState } from "./model";
import { nameOf } from "./model";

/** Fictional classroom fixtures. Dates are relative to the first visit, then persist. */
export function createSeed(now = new Date()): LocalState {
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const users: LocalState["users"] = [
    ["ana", "Ana", "Petrović"],
    ["marko", "Marko", "Jovanović"],
    ["milica", "Milica", "Nikolić"],
    ["luka", "Luka", "Ilić"],
    ["jelena", "Jelena", "Savić"],
    ["nikola", "Nikola", "Popović"],
  ].map(([id, firstName, lastName]) => ({
    id,
    firstName,
    lastName,
    email: `${id}@example.test`,
    role: "member",
    isActive: true,
  }));
  const data: LocalState = {
    version: 2,
    currentUserId: "ana",
    users,
    projects: [],
    columns: [],
    sprints: [],
    stories: [],
    tasks: [],
    comments: [],
    retros: [],
    events: [],
  };
  for (const [projectId, name, prefix, archived] of [
    ["campus", "CampusHub — studentski portal", "c", false],
    ["biblioteka", "Biblioteka — rezervacije knjiga", "b", false],
    ["radionica", "Arhiva — organizacija radionice", "r", true],
  ] as const) {
    data.projects.push({
      id: projectId,
      name,
      ownerId: "ana",
      publicToken: null,
      repoUrl: null,
      deletedAt: archived ? `${day(-2)}T12:00:00Z` : null,
      memberIds:
        projectId === "campus"
          ? ["ana", "marko", "milica", "luka"]
          : ["ana", "jelena", "nikola"],
    });
    for (const [position, label] of ["TO DO", "IN PROGRESS", "DONE"].entries())
      data.columns.push({
        id: `${prefix}-col-${position}`,
        projectId,
        name: label,
        position,
        wipLimit: position === 1 ? 3 : null,
        isDone: position === 2,
      });
    for (const [i, status, goal, start, end] of [
      [
        0,
        "completed",
        "Postaviti osnovu projekta i proveriti korisničke tokove",
        -24,
        -11,
      ],
      [
        1,
        "active",
        "Omogućiti pretragu, rezervaciju i jasne povratne poruke",
        -7,
        6,
      ],
      [
        2,
        "planned",
        "Pristupačnost, testiranje i priprema demonstracije",
        7,
        20,
      ],
    ] as const)
      data.sprints.push({
        id: `${prefix}-sprint-${i}`,
        projectId,
        name: `Sprint ${i + 1}`,
        goal,
        startDate: day(start),
        endDate: day(end),
        status,
        storyCount: 0,
        totalPoints: 0,
        retroCount: 0,
      });
  }
  const add = (
    projectId: string,
    id: string,
    title: string,
    description: string,
    col: number | null,
    sprint: number | null,
    assignee: string | null,
    points: number,
    priority: "low" | "medium" | "high",
    due: number | null,
  ) => {
    const p =
      projectId === "campus" ? "c" : projectId === "biblioteka" ? "b" : "r";
    data.stories.push({
      id,
      projectId,
      title,
      description,
      columnId: col === null ? null : `${p}-col-${col}`,
      sprintId: sprint === null ? null : `${p}-sprint-${sprint}`,
      sprintName: null,
      position: data.stories.length,
      authorId: "ana",
      authorName: "Ana Petrović",
      assigneeId: assignee,
      assigneeName: null,
      storyPoints: points,
      priority,
      dueDate: due === null ? null : day(due),
      commentCount: 0,
      taskCount: 0,
      tasksDone: 0,
      createdAt: `${day(-12)}T09:00:00Z`,
    });
  };
  add(
    "campus",
    "c-story-1",
    "Pretraga predmeta po nazivu i semestru",
    "Kao student želim da filtriram katalog predmeta kako bih brzo pronašao materijale.\n\nKriterijumi prihvatanja:\n• Pretraga ignoriše velika i mala slova.\n• Filter semestra radi zajedno sa pretragom.\n• Prazan rezultat prikazuje jasnu poruku.",
    1,
    1,
    "marko",
    5,
    "high",
    2,
  );
  add(
    "campus",
    "c-story-2",
    "Rezervacija termina za konsultacije",
    "Student bira slobodan termin. Zauzet termin se ne može rezervisati dva puta. Posle potvrde prikazati datum, vreme i nastavnika.",
    1,
    1,
    "ana",
    8,
    "high",
    4,
  );
  add(
    "campus",
    "c-story-3",
    "Validacija prijave na studentski događaj",
    "Obavezna polja: ime, indeks i kontakt. Greške prikazati uz polje; sačuvati već unete vrednosti. Proveriti granične slučajeve.",
    0,
    1,
    "milica",
    3,
    "high",
    -1,
  );
  add(
    "campus",
    "c-story-4",
    "Prazna stanja i poruke o grešci",
    "Dodati poruke kada nema predmeta, termina ili rezultata pretrage. Svako stanje nudi sledeći korak.",
    0,
    1,
    "luka",
    3,
    "medium",
    5,
  );
  add(
    "campus",
    "c-story-5",
    "Katalog predmeta prilagođen telefonu",
    "Kartice predmeta treba da budu čitljive na ekranu širine 360 px. Navigacija tastaturom i fokus moraju biti vidljivi.",
    2,
    1,
    "ana",
    5,
    "medium",
    -2,
  );
  add(
    "campus",
    "c-story-6",
    "Prikaz rasporeda konsultacija",
    "Prikazati grupisane termine po danu, sa jasnim statusom dostupnosti i brojem slobodnih mesta.",
    2,
    1,
    "marko",
    3,
    "medium",
    0,
  );
  add(
    "campus",
    "c-story-7",
    "Testovi pretrage i filtera",
    "Pokriti kombinovanje filtera, praznu vrednost, dijakritike i nepostojeći rezultat. Dokumentovati podatke i očekivane ishode.",
    null,
    2,
    "milica",
    5,
    "high",
    12,
  );
  add(
    "campus",
    "c-story-8",
    "Provera pristupačnosti forme",
    "Proveriti redosled tabulatora, povezanost labela i polja, kontrast i čitanje grešaka čitačem ekrana.",
    null,
    2,
    "luka",
    3,
    "medium",
    14,
  );
  add(
    "campus",
    "c-story-9",
    "Izvoz rasporeda u kalendar",
    "Istražiti ICS format i omogućiti preuzimanje konsultacija u lični kalendar.",
    null,
    null,
    null,
    8,
    "low",
    null,
  );
  add(
    "campus",
    "c-story-10",
    "Dokumentovati lokalni razvoj i deploy",
    "README treba da omogući drugom timu da postavi aplikaciju od praznog okruženja i proveri osnovni tok.",
    null,
    2,
    "ana",
    3,
    "medium",
    17,
  );
  add(
    "campus",
    "c-story-11",
    "Osnovni raspored i navigacija portala",
    "Usaglašeni tokovi: katalog → predmet → materijali. Pripremljen responzivan raspored i struktura stranica.",
    2,
    0,
    "luka",
    5,
    "medium",
    -12,
  );
  add(
    "campus",
    "c-story-12",
    "Model predmeta i početni podaci",
    "Pripremiti model predmeta, nastavnika i termina, kao i reprezentativne podatke za demonstraciju.",
    2,
    0,
    "marko",
    3,
    "high",
    -14,
  );
  add(
    "biblioteka",
    "b-story-1",
    "Pretraga knjiga po autoru i naslovu",
    "Kombinovana pretraga i filter dostupnosti; prikazati broj primeraka i lokaciju na polici.",
    1,
    1,
    "jelena",
    5,
    "high",
    3,
  );
  add(
    "biblioteka",
    "b-story-2",
    "Potvrda rezervacije primerka",
    "Rezervacija važi 48 sati. Prikazati rok preuzimanja i omogućiti otkazivanje.",
    0,
    1,
    "ana",
    5,
    "high",
    5,
  );
  add(
    "biblioteka",
    "b-story-3",
    "Kartica knjige sa dostupnošću",
    "Naslov, autor, godina i dostupni primerci prikazuju se i na telefonu.",
    2,
    1,
    "nikola",
    3,
    "medium",
    -1,
  );
  add(
    "biblioteka",
    "b-story-4",
    "Lista aktivnih rezervacija",
    "Grupisati rezervacije po roku preuzimanja i označiti istekle.",
    null,
    2,
    "jelena",
    5,
    "medium",
    12,
  );
  add(
    "biblioteka",
    "b-story-5",
    "Obaveštenje o vraćenom primerku",
    "Razraditi tok obaveštavanja studenta kada željena knjiga ponovo postane dostupna.",
    null,
    null,
    null,
    8,
    "low",
    null,
  );
  add(
    "radionica",
    "r-story-1",
    "Objaviti program radionice",
    "Arhivirani projekat služi za vežbu vraćanja iz korpe.",
    2,
    0,
    "ana",
    2,
    "low",
    -16,
  );
  const checks: [string, string, boolean][] = [
    ["c-story-1", "Pretraga po delu naziva i dijakriticima", true],
    ["c-story-1", "Kombinovanje sa filterom semestra", false],
    ["c-story-1", "Poruka kada nema rezultata", false],
    ["c-story-2", "Izbor slobodnog termina", true],
    ["c-story-2", "Sprečiti duplu rezervaciju", false],
    ["c-story-2", "Potvrda sa datumom i vremenom", false],
    ["c-story-3", "Poruke uz obavezna polja", false],
    ["c-story-3", "Proveriti pogrešan format indeksa", false],
    ["c-story-5", "Provera na 360 px", true],
    ["c-story-5", "Navigacija tastaturom", true],
    ["c-story-6", "Grupisanje po danu", true],
  ];
  checks.forEach(([storyId, title, done], i) =>
    data.tasks.push({ id: `seed-task-${i}`, storyId, title, done }),
  );
  [
    [
      "c-story-1",
      "milica",
      "Dogovor sa planiranja: prazan unos vraća sve predmete iz izabranog semestra.",
    ],
    [
      "c-story-1",
      "marko",
      "Pretraga radi. Danas završavam zajedničko filtriranje i testove za č/ć.",
    ],
    [
      "c-story-2",
      "ana",
      "Na pregledu obavezno demonstrirati slučaj kada drugi student zauzme termin.",
    ],
    [
      "c-story-3",
      "luka",
      "Pripremio sam primere pogrešnog indeksa i praznog kontakta za testiranje.",
    ],
    [
      "b-story-1",
      "jelena",
      "Dogovoreno je da se pretražuje i deo prezimena autora.",
    ],
  ].forEach(([storyId, authorId, body], i) =>
    data.comments.push({
      id: `seed-comment-${i}`,
      storyId,
      authorId,
      authorName: nameOf(users.find((x) => x.id === authorId)!),
      body,
      createdAt: `${day(-1)}T${String(9 + i).padStart(2, "0")}:15:00Z`,
    }),
  );
  data.retros.push(
    {
      id: "seed-retro-good",
      sprintId: "c-sprint-0",
      category: "good",
      body: "Male kartice i dnevni pregled table pomogli su da završimo osnovne tokove na vreme.",
      authorId: "ana",
      authorName: "Ana Petrović",
      createdAt: `${day(-10)}T12:00:00Z`,
    },
    {
      id: "seed-retro-bad",
      sprintId: "c-sprint-0",
      category: "bad",
      body: "Kriterijume prihvatanja treba dogovoriti pre početka implementacije, posebno za prazna stanja.",
      authorId: "milica",
      authorName: "Milica Nikolić",
      createdAt: `${day(-10)}T12:10:00Z`,
    },
  );
  data.events.push(
    {
      id: "seed-event-1",
      projectId: "campus",
      type: "sprint_started",
      actorName: "Ana Petrović",
      storyId: null,
      detail: "Sprint 2",
      day: day(-7),
      time: "09:00",
    },
    {
      id: "seed-event-2",
      projectId: "campus",
      type: "story_moved",
      actorName: "Marko Jovanović",
      storyId: "c-story-1",
      detail: "Pretraga predmeta po nazivu i semestru → IN PROGRESS",
      day: day(0),
      time: "09:20",
    },
    {
      id: "seed-event-3",
      projectId: "campus",
      type: "comment_added",
      actorName: "Milica Nikolić",
      storyId: "c-story-1",
      detail: "Pretraga predmeta po nazivu i semestru",
      day: day(0),
      time: "10:05",
    },
  );
  return data;
}
