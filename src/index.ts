#!/usr/bin/env node
// src/index.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { fetchMovies, MovieCategory } from './tmdbService'; // Akan kita buat nanti

// Muat variabel lingkungan dari .env
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Kesalahan: Kunci API TMDB tidak ditemukan. Pastikan Anda sudah membuat file .env dan menambahkan TMDB_API_KEY.');
  process.exit(1); // Keluar dari aplikasi dengan kode error
}

// Definisi perintah CLI menggunakan yargs
yargs(hideBin(process.argv))
  .command(
    '$0', // Perintah default jika tidak ada sub-perintah
    'Ambil dan tampilkan daftar film dari TMDB',
    (yargsInstance) => {
      return yargsInstance.option('type', {
        alias: 't',
        describe: 'Jenis film yang ingin ditampilkan',
        type: 'string',
        choices: ['playing', 'popular', 'top', 'upcoming'] as const, // `as const` untuk tipe yang lebih ketat
        demandOption: true, // Argumen ini wajib
      });
    },
    async (argv) => {
      const type = argv.type as MovieCategory; // Pastikan tipe sesuai
      console.log(`\nMemuat film dengan kategori: ${type}...\n`);

      try {
        const movies = await fetchMovies(type, TMDB_API_KEY);
        if (movies && movies.length > 0) {
          console.log(`--- Menampilkan Film ${type.toUpperCase()} ---`);
          movies.forEach((movie, index) => {
            console.log(`${index + 1}. Judul: ${movie.title}`);
            console.log(`   Tanggal Rilis: ${movie.release_date}`);
            console.log(`   Rating: ${movie.vote_average}/10 (dari ${movie.vote_count} suara)`);
            console.log(`   Overview: <span class="math-inline">\{movie\.overview\.substring\(0, 150\)\}</span>{movie.overview.length > 150 ? '...' : ''}`);
            console.log('---');
          });
        } else {
          console.log('Tidak ada film yang ditemukan untuk kategori ini.');
        }
      } catch (error: any) {
        console.error(`Gagal mengambil data film: ${error.message}`);
        if (error.response?.data?.status_message) {
            console.error(`Pesan dari API: ${error.response.data.status_message}`);
        }
      }
    }
  )
  .demandCommand(0,0) // Memastikan setidaknya ada satu perintah (dalam kasus ini, perintah default $0)
  .alias('h', 'help')
  .alias('v', 'version')
  .strict() // Aktifkan mode strict untuk validasi argumen
  .parse();