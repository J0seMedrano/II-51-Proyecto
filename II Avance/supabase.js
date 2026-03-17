import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ouwqylgisajfmjnmtrst.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d3F5bGdpc2FqZm1qbm10cnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTk4MzAsImV4cCI6MjA4OTA5NTgzMH0.giD1pT5dhK2caI-kwrs783jWmrAjejEyIbDWUHMEsuM";

export const supabase = createClient(supabaseUrl, supabaseKey);
