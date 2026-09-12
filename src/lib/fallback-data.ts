import { currencyFromMinor } from "@/lib/utils";

export type FallbackGenre = { id: string; name: string };
export type FallbackSeatStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
export type FallbackShowtime = {
  id: string;
  startsAt: string;
  endsAt: string;
  basePriceMinor: number;
  auditorium: {
    id: string;
    name: string;
    cinema: { id: string; name: string };
  };
  movie: { id: string; title: string };
};
export type FallbackAuditorium = {
  id: string;
  name: string;
  seatRows: number;
  seatColumns: number;
  showtimes: FallbackShowtime[];
};
export type FallbackMovie = {
  id: string;
  title: string;
  synopsis: string;
  language: string;
  movieGenres: Array<{ genreId: string; genre: FallbackGenre }>;
  showtimes: FallbackShowtime[];
};
export type FallbackCinema = {
  id: string;
  name: string;
  city: string;
  address: string;
  auditoriums: FallbackAuditorium[];
};
export type FallbackSeatMapSeat = {
  showtimeSeatId: string;
  status: FallbackSeatStatus;
  holdExpiresAt: string | null;
  priceMinor: number;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: string;
};

export const fallbackGenres: FallbackGenre[] = [
  { id: "genre-action", name: "Action" },
  { id: "genre-drama", name: "Drama" },
  { id: "genre-sci-fi", name: "Sci-Fi" },
  { id: "genre-family", name: "Family" },
];

const fallbackCinemaDowntown = { id: "cinema-downtown", name: "CineBook Downtown" };
const fallbackCinemaHarbor = { id: "cinema-harbor", name: "CineBook Harbor" };

const fallbackAuditoriumOne: FallbackAuditorium = {
  id: "auditorium-1",
  name: "Screen 1",
  seatRows: 6,
  seatColumns: 8,
  showtimes: [],
};
const fallbackAuditoriumTwo: FallbackAuditorium = {
  id: "auditorium-2",
  name: "Screen 2",
  seatRows: 5,
  seatColumns: 7,
  showtimes: [],
};
const fallbackAuditoriumThree: FallbackAuditorium = {
  id: "auditorium-3",
  name: "Screen A",
  seatRows: 6,
  seatColumns: 9,
  showtimes: [],
};

const now = new Date();

const showtimeSolarDrift: FallbackShowtime = {
  id: "showtime-solar-drift",
  movie: { id: "movie-solar-drift", title: "Solar Drift" },
  auditorium: {
    id: fallbackAuditoriumOne.id,
    name: fallbackAuditoriumOne.name,
    cinema: { id: fallbackCinemaDowntown.id, name: fallbackCinemaDowntown.name },
  },
  startsAt: new Date(now.getTime() + 4 * 60 * 60_000).toISOString(),
  endsAt: new Date(now.getTime() + 6 * 60 * 60_000).toISOString(),
  basePriceMinor: 1850,
};

const showtimeMonsoonLetters: FallbackShowtime = {
  id: "showtime-monsoon-letters",
  movie: { id: "movie-monsoon-letters", title: "Monsoon Letters" },
  auditorium: {
    id: fallbackAuditoriumTwo.id,
    name: fallbackAuditoriumTwo.name,
    cinema: { id: fallbackCinemaDowntown.id, name: fallbackCinemaDowntown.name },
  },
  startsAt: new Date(now.getTime() + 7 * 60 * 60_000).toISOString(),
  endsAt: new Date(now.getTime() + 9 * 60 * 60_000).toISOString(),
  basePriceMinor: 1600,
};

const showtimeNeonValley: FallbackShowtime = {
  id: "showtime-neon-valley",
  movie: { id: "movie-neon-valley", title: "Neon Valley" },
  auditorium: {
    id: fallbackAuditoriumThree.id,
    name: fallbackAuditoriumThree.name,
    cinema: { id: fallbackCinemaHarbor.id, name: fallbackCinemaHarbor.name },
  },
  startsAt: new Date(now.getTime() + 28 * 60 * 60_000).toISOString(),
  endsAt: new Date(now.getTime() + 30 * 60 * 60_000).toISOString(),
  basePriceMinor: 1450,
};

fallbackAuditoriumOne.showtimes.push(showtimeSolarDrift);
fallbackAuditoriumTwo.showtimes.push(showtimeMonsoonLetters);
fallbackAuditoriumThree.showtimes.push(showtimeNeonValley);

export const fallbackMovies: FallbackMovie[] = [
  {
    id: "movie-solar-drift",
    title: "Solar Drift",
    synopsis: "A rescue crew races through deep space to retrieve a missing research vessel.",
    language: "English",
    movieGenres: [
      { genreId: "genre-sci-fi", genre: fallbackGenres[2] },
      { genreId: "genre-action", genre: fallbackGenres[0] },
    ],
    showtimes: [showtimeSolarDrift],
  },
  {
    id: "movie-monsoon-letters",
    title: "Monsoon Letters",
    synopsis: "Two strangers reconnect through letters that arrive decades late.",
    language: "Hindi",
    movieGenres: [{ genreId: "genre-drama", genre: fallbackGenres[1] }],
    showtimes: [showtimeMonsoonLetters],
  },
  {
    id: "movie-neon-valley",
    title: "Neon Valley",
    synopsis: "A family adventure through a city powered by kinetic light.",
    language: "English",
    movieGenres: [{ genreId: "genre-family", genre: fallbackGenres[3] }],
    showtimes: [showtimeNeonValley],
  },
];

export const fallbackCinemas: FallbackCinema[] = [
  {
    id: fallbackCinemaDowntown.id,
    name: fallbackCinemaDowntown.name,
    city: "Seattle",
    address: "455 Pine Street, Seattle",
    auditoriums: [fallbackAuditoriumOne, fallbackAuditoriumTwo],
  },
  {
    id: fallbackCinemaHarbor.id,
    name: fallbackCinemaHarbor.name,
    city: "Seattle",
    address: "90 Harbor Ave, Seattle",
    auditoriums: [fallbackAuditoriumThree],
  },
];

export const fallbackLanguages = ["English", "Hindi"];

export const fallbackShowtimeSeatMap: Record<string, { showtime: FallbackShowtime; seats: FallbackSeatMapSeat[] }> = {
  [showtimeSolarDrift.id]: {
    showtime: showtimeSolarDrift,
    seats: Array.from({ length: 18 }, (_, index) => {
      const row = String.fromCharCode(65 + Math.floor(index / 8));
      const number = (index % 8) + 1;
      return {
        showtimeSeatId: `seat-solar-${index + 1}`,
        status: "AVAILABLE",
        holdExpiresAt: null,
        priceMinor: number <= 4 ? 2250 : 1850,
        seatId: `seat-solar-${index + 1}`,
        rowLabel: row,
        seatNumber: number,
        seatType: number <= 4 ? "PREMIUM" : "STANDARD",
      };
    }),
  },
  [showtimeMonsoonLetters.id]: {
    showtime: showtimeMonsoonLetters,
    seats: Array.from({ length: 15 }, (_, index) => {
      const row = String.fromCharCode(65 + Math.floor(index / 7));
      const number = (index % 7) + 1;
      return {
        showtimeSeatId: `seat-monsoon-${index + 1}`,
        status: index === 2 ? "HELD" : "AVAILABLE",
        holdExpiresAt: index === 2 ? new Date(Date.now() + 5 * 60_000).toISOString() : null,
        priceMinor: number <= 3 ? 2000 : 1600,
        seatId: `seat-monsoon-${index + 1}`,
        rowLabel: row,
        seatNumber: number,
        seatType: number <= 3 ? "PREMIUM" : "STANDARD",
      };
    }),
  },
  [showtimeNeonValley.id]: {
    showtime: showtimeNeonValley,
    seats: Array.from({ length: 18 }, (_, index) => {
      const row = String.fromCharCode(65 + Math.floor(index / 9));
      const number = (index % 9) + 1;
      return {
        showtimeSeatId: `seat-neon-${index + 1}`,
        status: index === 1 ? "BOOKED" : "AVAILABLE",
        holdExpiresAt: null,
        priceMinor: number <= 3 ? 1850 : 1450,
        seatId: `seat-neon-${index + 1}`,
        rowLabel: row,
        seatNumber: number,
        seatType: number <= 3 ? "PREMIUM" : "STANDARD",
      };
    }),
  },
};

export function fallbackPriceLabel(minor: number) {
  return currencyFromMinor(minor);
}
