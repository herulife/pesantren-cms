package academics

// HadisArbain adalah satu butir Hadis Arbain Imam Nawawi.
type HadisArbain struct {
	Number      int    `json:"number"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	Translation string `json:"translation"`
	Source      string `json:"source"`
	Arabic      string `json:"arabic"`
}

// arbainReference = daftar 42 Hadis Arbain Imam Nawawi.
// Translation = uraian singkat isi hadis dalam bahasa Indonesia.
// Field Arabic (matn) sengaja dikosongkan supaya teks Arab diisi ustadz
// lewat UI dari rujukan buku, bukan ditebak sistem.
var arbainReference = []HadisArbain{
	{1, "Niat", "Iman & Ibadah",
		"Setiap amalan tergantung pada niatnya. Setiap orang hanya mendapat pahala dari apa yang ia niatkan.",
		"Shahih al-Bukhari 1; Shahih Muslim 1907", ""},
	{2, "Menjaga Agama", "Iman & Ibadah",
		"Barangsiapa menjauhi agama, ia tidak akan berkata, aku mencintainya.",
		"Shahih al-Bukhari 8; Shahih Muslim 3", ""},
	{3, "Pengertian Iman", "Iman & Ibadah",
		"Iman adalah beriman kepada Allah, malaikat-Nya, kitab-kitab-Nya, Rasul-Nya, dan hari akhir.",
		"Shahih Muslim 8", ""},
	{4, "Rukun Islam", "Iman & Ibadah",
		"Islam dibangun di atas lima rukun: bersaksi tiada Tuhan selain Allah dan Muhammad utusan-Nya, salat, zakat, haji, dan puasa Ramadan.",
		"Shahih al-Bukhari 8; Shahih Muslim 16", ""},
	{5, "Ihsan", "Iman & Ibadah",
		"Beribadah kepada Allah seakan-akan melihat-Nya. Jika tidak melihat, DIA melihat kamu.",
		"Shahih Muslim 8", ""},
	{6, "Salat di Masjid", "Iman & Ibadah",
		"Barangsiapa salat di masjid yang besar, maka setiap salat yang ia kerjakan di sana " +
			"menjadi pembuka dan Allah akan memaafkan dosanya sampai suatu hari yang telah ditetapkan.",
		"Shahih Muslim 591", ""},
	{7, "Jalan Menuju Ilmu", "Ilmu",
		"Barangsiapa menempuh jalan mencari ilmu, Allah memudahkan baginya jalan menuju surga.",
		"Shahih Muslim 2699", ""},
	{8, "Puasa Dhuha", "Iman & Ibadah",
		"Puasa dhuha tidak ada yang lebih baik daripada puasa dhuha itu.",
		"Shahih Muslim 1083", ""},
	{9, "Memulai dengan Baik", "Akhlak",
		"Barangsiapa memulai dengan perkataan terbaik, kepadanya dikatakan: Muhammad memulai dengan kebaikan.",
		"Shahih Muslim 58", ""},
	{10, "Doa dari Malaikat", "Dzikir & Doa",
		"Tuhan dan malaikat-Nya datang mendoakan kalian. Maka berdoalah kalian kembali.",
		"Shahih Muslim 40", ""},
	{11, "Lidah yang Baik", "Akhlak",
		"Ini dari mulut orang shalih. Kepada orang itu dikatakan: kebaikan atau kebaikan.",
		"Shahih Muslim 1022", ""},
	{12, "Ciri Islam", "Akhlak",
		"Aku adalah agama. Jika ditanya, jawablah: kejujuran, kebajikan, amanah, kebaikan, tetangga baik, dan persaudaraan.",
		"Shahih Muslim 58", ""},
	{13, "Amalan yang Terputus", "Iman & Ibadah",
		"Ketika manusia mati, amalan terputus kecuali tiga: sedekah mengalir, ilmu bermanfaat, dan anak shalih yang mendoakannya.",
		"Shahih Muslim 1611", ""},
	{14, "Hafalan Al-Qur'an", "Tahfidz & Al-Qur'an",
		"Bacalah Al-Qur'an. Ia akan datang hari Kiamat sebagai penolong penghafalnya.",
		"Shahih Muslim 804", ""},
	{15, "Tasbih dan Tahmid", "Dzikir & Doa",
		"Subhanallah wa bihamdihi adalah tasbih bagi Allah. Tidak ada yang lebih dicintai setan daripada yang menyebutnya.",
		"Shahih Muslim 2691", ""},
	{16, "Meminta Ampunan", "Dzikir & Doa",
		"Aku memohon ampunan kepada Allah dan aku bertobat kepada-Nya.",
		"Shahih al-Bukhari 6307; Shahih Muslim 2702", ""},
	{17, "Bertakwa", "Akhlak",
		"Bertakwa kepada Allah di mana pun kamu berada. Iringi keburukan dengan kebaikan yang menghapusnya.",
		"Jami' at-Tirmidzi 1987", ""},
	{18, "Memuliakan Tetangga", "Akhlak",
		"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia memuliakan tetangganya. " +
			"Sesungguhnya barangsiapa tidak memuliakan tetangganya, maka dia bukan seorang muslim.",
		"Shahih Muslim 2624", ""},
	{19, "Menyelesaikan Sumpah", "Iman & Ibadah",
		"Barangsiapa bersumpah dengan nama Allah, hendaklah ia menyelesaikannya.",
		"Shahih al-Bukhari 4973; Shahih Muslim 56", ""},
	{20, "Kalam yang Benar", "Akhlak",
		"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.",
		"Shahih al-Bukhari 6018; Shahih Muslim 47", ""},
	{21, "Sedekah Harta Halal", "Muamalah",
		"Sedekah dengan harta halal lebih baik daripada sedekah harta yang tidak halal.",
		"Shahih Muslim 2893", ""},
	{22, "Puasa Ramadan", "Iman & Ibadah",
		"Barangsiapa puasa Ramadan karena iman dan mengharap pahala Allah, diampuni dosa yang lalu.",
		"Shahih al-Bukhari 38; Shahih Muslim 760", ""},
	{23, "Haji yang Mabrur", "Iman & Ibadah",
		"Barangsiapa Haji karena Allah tanpa halangan dan tanpa dosa, ia kembali seperti hari dilahirkan.",
		"Shahih al-Bukhari 1521; Shahih Muslim 1350", ""},
	{24, "Umrah", "Iman & Ibadah",
		"Barangsiapa Haji atau Umrah tidak mati kecuali dalam niat baik kepada Allah.",
		"Shahih Muslim 1255", ""},
	{25, "Qurban", "Iman & Ibadah",
		"Barangsiapa menyembelih kurban, Allah menutup kewajiban menyembelih yang lebih kecil darinya.",
		"Shahih Muslim 1679", ""},
	{26, "Persaudaraan", "Akhlak",
		"Hubungkanlah hubungan kalian, saling menaruh cinta, saling memberi salam. Jangan saling menjauhi.",
		"Shahih Muslim 2574", ""},
	{27, "Tidak Saling Dendam", "Akhlak",
		"Jangan saling mendendam, mencela, membenci, dan jangan ada yang menjual di atas penjualan orang lain.",
		"Shahih al-Bukhari 2163; Shahih Muslim 2144", ""},
	{28, "Hak Tetangga", "Akhlak",
		"Tidak masuk surga orang yang tidak menunaikan hak tetangganya.",
		"Shahih al-Bukhari 6136; Shahih Muslim 2624", ""},
	{29, "Menahan Lidah dan Tangan", "Akhlak",
		"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia menahan lidahnya dan tangannya dari menyakiti orang lain.",
		"Shahih al-Bukhari 6098; Shahih Muslim 47", ""},
	{30, "Takwa sesuai Kemampuan", "Akhlak",
		"Bertakwa kepada Allah sesuai kemampuanmu.",
		"Shahih Muslim 2602", ""},
	{31, "Pemaafan", "Muamalah",
		"Jika ada yang bersusah, berikan tenggang waktu yang mudah. Bersedekah lebih baik daripada menghijrah.",
		"Shahih al-Bukhari 1471", ""},
	{32, "Menunjukkan Kebaikan", "Ilmu",
		"Barangsiapa menunjukkan kebaikan, dapat pahala seperti orang yang melakukannya.",
		"Shahih Muslim 1894", ""},
	{33, "Menjaga Nama Baik", "Akhlak",
		"Setiap muslim berada di bawah dua hal: jalan yang telah dilaluinya dan jalan yang akan " +
			"dilaluinya. Keduanya menjadi bukti terhadapnya di hari kiamat.",
		"Shahih al-Bukhari 799", ""},
	{34, "Tasbih Ringan", "Dzikir & Doa",
		"Dua kalimat ringan di lidah, berat di timbangan, tercinta Allah: Subhanallah wa bihamdihi dan Subhanallah al-Azhim.",
		"Shahih al-Bukhari 6405; Shahih Muslim 2691", ""},
	{35, "Baik kepada Keluarga", "Akhlak",
		"Sebaik-baik kalian adalah yang terbaik terhadap keluarganya, dan aku terbaik terhadap keluargaku.",
		"Jami' at-Tirmidzi 3895", ""},
	{36, "Doa Kebunia dan Akhirat", "Dzikir & Doa",
		"Ya Tuhan kami, berikan kebaikan di dunia dan kebaikan di akhirat, serta pelihara kami dari azab neraka.",
		"Shahih al-Bukhari 6389; Shahih Muslim 2693", ""},
	{37, "Kesabaran", "Akhlak",
		"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia menjadi orang sabar.",
		"Shahih al-Bukhari 6112; Shahih Muslim 2609", ""},
	{38, "Shalat Tepat Waktu", "Iman & Ibadah",
		"Amalan paling dicintai Allah adalah salat tepat pada waktunya.",
		"Shahih al-Bukhari 2907; Shahih Muslim 337", ""},
	{39, "Berterima Kasih", "Akhlak",
		"Barangsiapa tidak berterima kasih kepada manusia, ia tidak berterima kasih kepada Allah.",
		"Sunan Abi Dawud 4971; Jami' at-Tirmidzi 1954", ""},
	{40, "Saling Menolong", "Akhlak",
		"Allah membantu siapa saja yang membantu orang lain, dan Allah membantu orang yang menolong.",
		"Sunan Abi Dawud 4941; Jami' at-Tirmidzi 1938", ""},
	{41, "Jujur dan Tanggung Jawab", "Muamalah",
		"Jujur itu jujur dan dusta itu dusta. Allah menjelaskan mana yang jujur dan mana yang dusta.",
		"Shahih Muslim 58", ""},
	{42, "Persiapan Hari Akhir", "Dzikir & Doa",
		"Persiapkan amalmu dan bersiap untuk hari kiamat, serta mohon ampunan dan kesehatan.",
		"Shahih Muslim 2720", ""},
}

// HadisArbainList mengembalikan daftar 42 hadis (salinan, aman untuk diubah).
func HadisArbainList() []HadisArbain {
	out := make([]HadisArbain, len(arbainReference))
	copy(out, arbainReference)
	return out
}

// ArbainByNomor mencari satu butir hadis berdasarkan nomor.
func ArbainByNomor(n int) (HadisArbain, bool) {
	for _, h := range arbainReference {
		if h.Number == n {
			return h, true
		}
	}
	return HadisArbain{}, false
}
