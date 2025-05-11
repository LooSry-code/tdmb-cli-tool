// src/services/tmdbService.ts
import axios from 'axios'; // Impor default axios
// Tidak perlu impor AxiosError secara eksplisit jika menggunakan isAxiosError
// Namun, jika Anda ingin menggunakan tipe AxiosError secara eksplisit di tempat lain,
// dan impornya bekerja setelah langkah di bawah, Anda bisa menambahkannya kembali.
// import { AxiosError } from 'axios'; // Coba lagi setelah langkah troubleshooting

const API_BASE_URL = 'https://api.themoviedb.org/3';

export type MovieCategory = 'playing' | 'popular' | 'top' | 'upcoming';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
}

interface TmdbApiResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

const categoryEndpoints: Record<MovieCategory, string> = {
  playing: 'movie/now_playing',
  popular: 'movie/popular',
  top: 'movie/top_rated',
  upcoming: 'movie/upcoming',
};

export async function fetchMovies(category: MovieCategory, apiKey: string): Promise<Movie[]> {
  const endpoint = categoryEndpoints[category];
  if (!endpoint) {
    throw new Error(`Kategori film tidak valid: ${category}`);
  }

  const url = `${API_BASE_URL}/${endpoint}`;

  try {
    const response = await axios.get<TmdbApiResponse>(url, {
      params: {
        api_key: apiKey,
        language: 'id-ID',
        page: 1,
      },
    });

    if (response.data && response.data.results) {
      return response.data.results;
    } else {
      // Ini seharusnya tidak terjadi jika API merespons dengan benar dan TmdbApiResponse cocok
      throw new Error('Format respons API tidak valid atau tidak ada hasil.');
    }
  } catch (error: unknown) { // Tangkap error sebagai 'unknown' untuk keamanan tipe
    if (axios.isAxiosError(error)) { // Gunakan type guard
      // Sekarang TypeScript tahu 'error' adalah AxiosError
      let errorMessage = `Gagal mengambil data dari TMDB (status: ${error.response?.status || 'N/A'})`;
      if (error.response) {
        // Request dibuat dan server merespons dengan status code
        // yang bukan 2xx
        console.error(`Detail Error API: Status ${error.response.status}, Data:`, error.response.data);
        const apiStatusMessage = (error.response.data as any)?.status_message;
        if (apiStatusMessage) {
          errorMessage = `Gagal mengambil data dari TMDB: ${apiStatusMessage} (status: ${error.response.status})`;
        } else {
          errorMessage = `Gagal mengambil data dari TMDB: ${error.message} (status: ${error.response.status})`;
        }
      } else if (error.request) {
        // Request dibuat tapi tidak ada respons diterima
        errorMessage = 'Tidak ada respons dari server TMDB. Periksa koneksi internet Anda atau konfigurasi server.';
      } else {
        // Terjadi kesalahan saat menyiapkan request
        errorMessage = `Kesalahan saat menyiapkan request ke TMDB: ${error.message}`;
      }
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      // Handle error umum lainnya
      throw new Error(`Terjadi kesalahan yang tidak diketahui: ${error.message}`);
    } else {
      // Handle kasus di mana yang di-throw bukan objek Error
      throw new Error('Terjadi kesalahan yang tidak diketahui.');
    }
  }
}