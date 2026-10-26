/** Original fixture text, used only to recognize untouched examples during upgrades. */
export const LEGACY_STORY_COPY = {
  "c-story-1": {
    projectId: "campus",
    title: "Pretraga predmeta po nazivu i semestru",
    description:
      "Kao student želim da filtriram katalog predmeta kako bih brzo pronašao materijale.\n\nKriterijumi prihvatanja:\n• Pretraga ignoriše velika i mala slova.\n• Filter semestra radi zajedno sa pretragom.\n• Prazan rezultat prikazuje jasnu poruku.",
  },
  "c-story-2": {
    projectId: "campus",
    title: "Rezervacija termina za konsultacije",
    description:
      "Student bira slobodan termin. Zauzet termin se ne može rezervisati dva puta. Posle potvrde prikazati datum, vreme i nastavnika.",
  },
  "c-story-3": {
    projectId: "campus",
    title: "Validacija prijave na studentski događaj",
    description:
      "Obavezna polja: ime, indeks i kontakt. Greške prikazati uz polje; sačuvati već unete vrednosti. Proveriti granične slučajeve.",
  },
  "c-story-4": {
    projectId: "campus",
    title: "Prazna stanja i poruke o grešci",
    description:
      "Dodati poruke kada nema predmeta, termina ili rezultata pretrage. Svako stanje nudi sledeći korak.",
  },
  "c-story-5": {
    projectId: "campus",
    title: "Katalog predmeta prilagođen telefonu",
    description:
      "Kartice predmeta treba da budu čitljive na ekranu širine 360 px. Navigacija tastaturom i fokus moraju biti vidljivi.",
  },
  "c-story-6": {
    projectId: "campus",
    title: "Prikaz rasporeda konsultacija",
    description:
      "Prikazati grupisane termine po danu, sa jasnim statusom dostupnosti i brojem slobodnih mesta.",
  },
  "c-story-7": {
    projectId: "campus",
    title: "Testovi pretrage i filtera",
    description:
      "Pokriti kombinovanje filtera, praznu vrednost, dijakritike i nepostojeći rezultat. Dokumentovati podatke i očekivane ishode.",
  },
  "c-story-8": {
    projectId: "campus",
    title: "Provera pristupačnosti forme",
    description:
      "Proveriti redosled tabulatora, povezanost labela i polja, kontrast i čitanje grešaka čitačem ekrana.",
  },
  "c-story-9": {
    projectId: "campus",
    title: "Izvoz rasporeda u kalendar",
    description:
      "Istražiti ICS format i omogućiti preuzimanje konsultacija u lični kalendar.",
  },
  "c-story-10": {
    projectId: "campus",
    title: "Dokumentovati lokalni razvoj i deploy",
    description:
      "README treba da omogući drugom timu da postavi aplikaciju od praznog okruženja i proveri osnovni tok.",
  },
  "c-story-11": {
    projectId: "campus",
    title: "Osnovni raspored i navigacija portala",
    description:
      "Usaglašeni tokovi: katalog → predmet → materijali. Pripremljen responzivan raspored i struktura stranica.",
  },
  "c-story-12": {
    projectId: "campus",
    title: "Model predmeta i početni podaci",
    description:
      "Pripremiti model predmeta, nastavnika i termina, kao i reprezentativne podatke za demonstraciju.",
  },
  "b-story-1": {
    projectId: "biblioteka",
    title: "Pretraga knjiga po autoru i naslovu",
    description:
      "Kombinovana pretraga i filter dostupnosti; prikazati broj primeraka i lokaciju na polici.",
  },
  "b-story-2": {
    projectId: "biblioteka",
    title: "Potvrda rezervacije primerka",
    description:
      "Rezervacija važi 48 sati. Prikazati rok preuzimanja i omogućiti otkazivanje.",
  },
  "b-story-3": {
    projectId: "biblioteka",
    title: "Kartica knjige sa dostupnošću",
    description:
      "Naslov, autor, godina i dostupni primerci prikazuju se i na telefonu.",
  },
  "b-story-4": {
    projectId: "biblioteka",
    title: "Lista aktivnih rezervacija",
    description:
      "Grupisati rezervacije po roku preuzimanja i označiti istekle.",
  },
  "b-story-5": {
    projectId: "biblioteka",
    title: "Obaveštenje o vraćenom primerku",
    description:
      "Razraditi tok obaveštavanja studenta kada željena knjiga ponovo postane dostupna.",
  },
  "r-story-1": {
    projectId: "radionica",
    title: "Objaviti program radionice",
    description: "Arhivirani projekat služi za vežbu vraćanja iz korpe.",
  },
} as const;
