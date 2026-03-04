import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  ArrowLeft, 
  Trophy,
  Info,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useTheme } from '../contexts/ThemeContext';

export default function ScoreCalculator() {
  const [hasDGNL, setHasDGNL] = useState(true); // Có thi ĐGNL hay không

  // Admission Scores State
  const [admissionScores, setAdmissionScores] = useState({ daiTra: [], oisp: [] });
  const [loadingScores, setLoadingScores] = useState(true);
  
  // Collapsible UI state
  const [expandedMain, setExpandedMain] = useState({ qual: true, unqual: false });
  const [expandedSub, setExpandedSub] = useState({ 
    qualDaiTra: true, qualOISP: true, 
    unqualDaiTra: true, unqualOISP: true 
  });

  // Fetch admission scores on mount
  useEffect(() => {
    async function fetchScores() {
      try {
        const { data, error } = await insforge.database
          .from('admission_scores_2025')
          .select('*')
          .order('score', { ascending: false });
          
        if (data) {
          setAdmissionScores({
            daiTra: data.filter(d => d.program_category === 'Chương trình đại trà'),
            oisp: data.filter(d => d.program_category !== 'Chương trình đại trà')
          });
        }
      } catch (err) {
        console.error("Failed to fetch admission scores:", err);
      } finally {
        setLoadingScores(false);
      }
    }
    fetchScores();
  }, []);
  const [scores, setScores] = useState({
    dgnlScore: '',        // Điểm ĐGNL đã trừ Toán (0-900)
    dgnlToan: '',         // Điểm Toán trong ĐGNL
    tnthptToan: '',       // Điểm Toán TNTHPT
    tnthptMon2: '',       // Điểm môn 2 TNTHPT
    tnthptMon3: '',       // Điểm môn 3 TNTHPT
    tong9mon: '',         // Tổng 9 môn
    toan10: '', ly10: '', hoa10: '', // Điểm chi tiết lớp 10
    toan11: '', ly11: '', hoa11: '', // Điểm chi tiết lớp 11
    toan12: '', ly12: '', hoa12: '', // Điểm chi tiết lớp 12
    diemThuong: '',       // Điểm thưởng
    diemXetThuong: '',    // Điểm xét thưởng
    diemKhuyenKhich: '',  // Điểm khuyến khích
    khuVuc: '0',          // Điểm ưu tiên khu vực
    doiTuong: '0',        // Điểm ưu tiên đối tượng
  });
  const [showResult, setShowResult] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Handle score input
  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
    setShowResult(false);
  };

  // Reset all
  const handleReset = () => {
    setScores({
      dgnlScore: '',
      dgnlToan: '',
      tnthptToan: '',
      tnthptMon2: '',
      tnthptMon3: '',
      tong9mon: '',
      toan10: '', ly10: '', hoa10: '',
      toan11: '', ly11: '', hoa11: '',
      toan12: '', ly12: '', hoa12: '',
      diemThuong: '',
      diemXetThuong: '',
      diemKhuyenKhich: '',
      khuVuc: '0',
      doiTuong: '0',
    });
    setShowResult(false);
  };

  // Calculate scores
  const result = useMemo(() => {
    const dgnlScore = parseFloat(scores.dgnlScore) || 0; // Điểm ĐGNL đã trừ Toán
    const dgnlToan = parseFloat(scores.dgnlToan) || 0;        // Điểm Toán ĐGNL
    const tnthptToan = parseFloat(scores.tnthptToan) || 0;
    const tnthptMon2 = parseFloat(scores.tnthptMon2) || 0;
    const tnthptMon3 = parseFloat(scores.tnthptMon3) || 0;
    // Điểm TNTHPT quy đổi = [Tổng điểm 3 môn, TOÁN x 2] / 4 x 10
    const tongTNTHPT = tnthptToan * 2 + tnthptMon2 + tnthptMon3;
    const diemTNTHPTQuyDoi = (tongTNTHPT / 4) * 10;

    // Điểm học THPT quy đổi
    let diemHocTHPTQuyDoi = 0;
    const t_tong9mon = parseFloat(scores.tong9mon);
    
    if (!isNaN(t_tong9mon) && t_tong9mon > 0) {
      // Tính bằng tổng 9 môn
      diemHocTHPTQuyDoi = (t_tong9mon / 9) * 10;
    } else {
      // Tính bằng lưới chi tiết 9 môn
      const toanTB = ((parseFloat(scores.toan10)||0) + (parseFloat(scores.toan11)||0) + (parseFloat(scores.toan12)||0)) / 3;
      const mon2TB = ((parseFloat(scores.ly10)||0) + (parseFloat(scores.ly11)||0) + (parseFloat(scores.ly12)||0)) / 3;
      const mon3TB = ((parseFloat(scores.hoa10)||0) + (parseFloat(scores.hoa11)||0) + (parseFloat(scores.hoa12)||0)) / 3;
      
      const tongHocBa = toanTB * 2 + mon2TB + mon3TB;
      diemHocTHPTQuyDoi = (tongHocBa / 4) * 10;
    }

    let diemNangLuc;

    if (hasDGNL) {
      // Với thí sinh CÓ thi ĐGNL:
      // Điểm năng lực = [Điểm ĐGNL đã trừ Toán + Điểm Toán × 2] / 15
      diemNangLuc = (dgnlScore + (dgnlToan * 2)) / 15;
    } else {
      // Với thí sinh KHÔNG thi ĐGNL:
      // Điểm năng lực = Điểm TNTHPT quy đổi x 0.75
      diemNangLuc = diemTNTHPTQuyDoi * 0.75;
    }

    // Điểm học lực = Điểm năng lực × 70% + Điểm TNTHPT quy đổi × 20% + Điểm học THPT quy đổi × 10%
    const diemHocLuc = (diemNangLuc * 0.70) + (diemTNTHPTQuyDoi * 0.20) + (diemHocTHPTQuyDoi * 0.10);

    // Tính điểm cộng
    const diemThuong = parseFloat(scores.diemThuong) || 0;
    const diemXetThuong = parseFloat(scores.diemXetThuong) || 0;
    const diemKhuyenKhich = parseFloat(scores.diemKhuyenKhich) || 0;
    const diemCongThanhTich = diemThuong + diemXetThuong + diemKhuyenKhich;
    
    let diemCong = 0;
    if (diemHocLuc + diemCongThanhTich < 100) {
      diemCong = diemCongThanhTich;
    } else {
      diemCong = Math.max(0, 100 - diemHocLuc);
    }

    // Tính điểm ưu tiên
    const diemKhuVuc = parseFloat(scores.khuVuc) || 0;
    const diemDoiTuong = parseFloat(scores.doiTuong) || 0;
    const inputDiemUuTien = diemKhuVuc + diemDoiTuong;
    
    const diemUuTienQuyDoi = (inputDiemUuTien / 3) * 10;
    
    let diemUuTienThucTe = 0;
    if (diemHocLuc + diemCong < 75) {
      diemUuTienThucTe = diemUuTienQuyDoi;
    } else {
      diemUuTienThucTe = ((100 - diemHocLuc - diemCong) / 25) * diemUuTienQuyDoi;
    }
    
    const diemXetTuyen = diemHocLuc + diemCong + diemUuTienThucTe;

    return {
      dgnlScore,
      dgnlToan,
      diemNangLuc: diemNangLuc.toFixed(2),
      diemTNTHPTQuyDoi: diemTNTHPTQuyDoi.toFixed(2),
      diemHocTHPTQuyDoi: diemHocTHPTQuyDoi.toFixed(2),
      diemHocLuc: diemHocLuc.toFixed(2),
      diemCong: diemCong.toFixed(2),
      diemUuTien: diemUuTienThucTe.toFixed(2),
      diemXetTuyen: diemXetTuyen.toFixed(2),
      tongTNTHPT: tongTNTHPT.toFixed(1),
    };
  }, [scores, hasDGNL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-neutral-200 dark:border-dark-border transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1a2d6d] to-[#3b7dd8] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-neutral-800 dark:text-dark-text-main tracking-tight">Tính điểm xét tuyển</h1>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="absolute right-4 w-10 h-10 rounded-xl bg-slate-50 dark:bg-dark-hover flex items-center justify-center text-slate-600 dark:text-dark-text-sec hover:bg-slate-100 dark:hover:bg-dark-hover/80 hover:text-[#1a2d6d] dark:hover:text-white transition-all duration-300"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Formula Info */}
        <section className="mb-8 bg-gradient-to-br from-[#1a2d6d] to-[#3b7dd8] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-amber-300 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold !text-white mb-2">Công thức tính điểm PT2</h2>
              <div className="bg-white/90 dark:bg-white/80 rounded-xl p-4 font-mono text-sm backdrop-blur-sm border border-white/20 text-black">
                <p className="mb-2 leading-relaxed">
                  <span className="text-[#1a2d6d] font-bold tracking-wide">Điểm học lực</span> = 
                  <span className="text-black font-semibold"> Điểm năng lực × 70%</span> <span className="text-black">+</span> 
                  <span className="text-black font-semibold"> Điểm TNTHPT<sub>quy đổi</sub> × 20%</span> <span className="text-black">+</span> 
                  <span className="text-black font-semibold"> Điểm học THPT<sub>quy đổi</sub> × 10%</span>
                </p>
                <p className="leading-relaxed border-t border-black/10 pt-2 mt-2">
                  <span className="text-[#1a2d6d] font-bold tracking-wide">Điểm xét tuyển</span> = 
                  <span className="text-black font-semibold"> Điểm học lực</span> <span className="text-black">+</span> 
                  <span className="text-black font-semibold"> Điểm cộng</span> <span className="text-black">+</span> 
                  <span className="text-black font-semibold"> Điểm ưu tiên</span>
                </p>
              </div>

              <div className="mt-3 bg-[#0a237d] dark:bg-[#1a2d6d] border-2 border-dashed border-white/80 rounded px-4 py-2 text-white font-mono text-[13px] text-center shadow-inner">
                <span className="font-semibold text-[#8eb4ff]">Lưu ý:</span> Nếu <span className="font-semibold text-white">[Điểm học lực]</span> + <span className="font-semibold text-white">[Điểm cộng]</span> &ge; 75<br className="sm:hidden" />
                <span className="hidden sm:inline"> thì </span>
                <span className="font-bold">Điểm ưu tiên</span> = (100 - [Điểm học lực] - [Điểm cộng])/25 &times; [Điểm ưu tiên<sub>quy đổi</sub>], làm tròn đến 0.01
              </div>
            </div>
          </div>
        </section>

        {/* International Certificates Info */}
        <section className="mb-8 bg-white dark:bg-dark-surface rounded-2xl p-6 border border-neutral-200 dark:border-dark-border shadow-lg transition-colors duration-300">
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-[#1a2d6d] dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="w-full">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-dark-text-main mb-2">Quy đổi chứng chỉ quốc tế</h2>
              <p className="text-sm text-neutral-600 dark:text-dark-text-sec mb-4 leading-relaxed">
                Bảng quy đổi điểm xét tuyển dành cho thí sinh có chứng chỉ học thuật quốc tế (như SAT, ACT, IB, A-Level, ATAR) để thay thế hoặc tính thành điểm học lực theo hình thức xét tuyển PT2.
              </p>
              <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-dark-border bg-white dark:bg-[#2a2b2c] p-4 sm:p-6 flex justify-center items-center">
                <img 
                  src="https://res.cloudinary.com/dzpwnejs8/image/upload/v1772278416/j6asgbnnih8ooarkcqsr.png" 
                  alt="Bảng quy đổi chứng chỉ quốc tế" 
                  className="max-w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Toggle DGNL */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-neutral-400 dark:text-dark-text-sec" />
              <span className="font-medium text-neutral-700 dark:text-dark-text-main">Bạn có tham gia kỳ thi ĐGNL không?</span>
            </div>
            <div className="flex gap-2 ml-auto w-full sm:w-auto">
              <button
                onClick={() => { setHasDGNL(true); setShowResult(false); }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                  hasDGNL 
                    ? 'bg-[#1a2d6d] text-white shadow-md' 
                    : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-dark-text-sec hover:bg-neutral-200 dark:hover:bg-dark-border'
                }`}
              >
                Có thi ĐGNL
              </button>
              <button
                onClick={() => { setHasDGNL(false); setShowResult(false); }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                  !hasDGNL 
                    ? 'bg-[#1a2d6d] text-white shadow-md' 
                    : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-dark-text-sec hover:bg-neutral-200 dark:hover:bg-dark-border'
                }`}
              >
                Không thi ĐGNL
              </button>
            </div>
          </div>
        </section>

        {/* Score Input Form */}
        <section className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200 dark:border-dark-border shadow-lg p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-dark-text-main">Nhập điểm số</h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-neutral-500 dark:text-dark-text-sec hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Đặt lại
            </button>
          </div>

          <div className="space-y-6">
            {/* ĐGNL Scores - Only show if hasDGNL */}
            <AnimatePresence>
              {hasDGNL && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Điểm năng lực</strong> = [Điểm ĐGNL, TOÁN × 2] / 15
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                        Điểm ĐGNL đã trừ Toán (0 - 900)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="900"
                        value={scores.dgnlScore}
                        onChange={(e) => handleScoreChange('dgnlScore', e.target.value)}
                        placeholder="VD: 600"
                        className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-[#1a2d6d] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                        Điểm Toán trong ĐGNL (0 - 300) <span className="text-[#1a2d6d] dark:text-blue-400 font-semibold">(sẽ được nhân 2)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={scores.dgnlToan}
                        onChange={(e) => handleScoreChange('dgnlToan', e.target.value)}
                        placeholder="VD: 250"
                        className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-[#1a2d6d] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Điểm TNTHPT */}
            <div>
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 mb-4">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Điểm TNTHPT quy đổi</strong> = [Tổng điểm thi 3 môn trong tổ hợp, TOÁN × 2] / 4 × 10
                </span>
              </div>

              <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                Điểm 3 môn thi TNTHPT trong tổ hợp
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'tnthptToan', placeholder: 'Môn Toán' },
                  { key: 'tnthptMon2', placeholder: 'Môn 2' },
                  { key: 'tnthptMon3', placeholder: 'Môn 3' }
                ].map((field) => (
                  <div key={field.key}>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={scores[field.key]}
                      onChange={(e) => handleScoreChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Điểm học bạ */}
            <div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-sm text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30 mb-4">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Điểm học THPT quy đổi</strong> = [TB cộng điểm TB 3 năm các môn trong tổ hợp, TOÁN × 2] × 10
                </span>
              </div>

              <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                Nhập điểm học bạ <span className="font-normal italic">(*Dùng dấu (.) cho số thập phân*)</span>
              </label>
              
              {/* Tổng 9 môn */}
              <div className="flex">
                <div className="bg-neutral-100 dark:bg-dark-border text-neutral-600 dark:text-dark-text-main px-4 py-3 rounded-l-xl border border-r-0 border-neutral-300 dark:border-dark-border font-medium flex items-center min-w-[80px] justify-center">
                  Tổng
                </div>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="0.01"
                  value={scores.tong9mon}
                  onChange={(e) => handleScoreChange('tong9mon', e.target.value)}
                  placeholder="Nhập điểm tổng 9 môn"
                  className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-r-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
                />
              </div>

              <div className="text-sm italic text-neutral-500 dark:text-dark-text-sec my-3">hoặc</div>

              {/* Lưới nhập điểm chi tiết */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Toán 10', key: 'toan10' }, { label: 'Lý 10', key: 'ly10' }, { label: 'Hóa, Anh 10', key: 'hoa10' },
                  { label: 'Toán 11', key: 'toan11' }, { label: 'Lý 11', key: 'ly11' }, { label: 'Hóa, Anh 11', key: 'hoa11' },
                  { label: 'Toán 12', key: 'toan12' }, { label: 'Lý 12', key: 'ly12' }, { label: 'Hóa, Anh 12', key: 'hoa12' }
                ].map((field) => (
                  <div key={field.key} className="flex h-11">
                    <div className="w-1/3 sm:w-2/5 bg-neutral-100 dark:bg-dark-border text-neutral-600 dark:text-dark-text-main px-2 py-1 leading-tight rounded-l-lg border border-r-0 border-neutral-300 dark:border-dark-border text-xs sm:text-sm font-medium flex items-center justify-center text-center">
                      {field.label}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={scores[field.key]}
                      onChange={(e) => handleScoreChange(field.key, e.target.value)}
                      placeholder="Nhập điểm..."
                      className="w-2/3 sm:w-3/5 px-3 py-2 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec text-sm"
                    />
                  </div>
                ))}
              </div>
              
              {/* Note about combination subjects */}
              <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600 dark:text-dark-text-sec">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                <p>
                  <strong>Lưu ý:</strong> Điểm TB 3 năm là điểm trung bình của <span className="font-semibold text-purple-700 dark:text-purple-400">các môn trong tổ hợp</span>, không phải toàn bộ các môn học tại trường.
                </p>
              </div>
            </div>

            {/* Điểm cộng */}
            <div>
              <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-sm text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30 mb-4">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Điểm cộng thành tích</strong> = Điểm thưởng + Điểm xét thưởng + Điểm khuyến khích
                </span>
              </div>

              <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                Điểm cộng (không vượt quá 10 điểm đối với thang 100)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'diemThuong', placeholder: 'Điểm thưởng (0 - 3)', desc: 'Thí sinh được tuyển thẳng nhưng không dùng để xét tuyển thẳng', max: '3' },
                  { key: 'diemXetThuong', placeholder: 'Xét thưởng (0 - 1.5)', desc: 'Thí sinh có thành tích hoặc có năng khiếu đặc biệt', max: '1.5' },
                  { key: 'diemKhuyenKhich', placeholder: 'Khuyến khích (0 - 1.5)', desc: 'Thí sinh có chứng chỉ ngoại ngữ hoặc chứng chỉ quốc tế', max: '1.5' }
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={field.max}
                      step="0.01"
                      value={scores[field.key]}
                      onChange={(e) => handleScoreChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec text-sm sm:text-base"
                    />
                    <span className="text-xs text-neutral-500 dark:text-dark-text-sec px-1 leading-snug">
                      {field.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Điểm ưu tiên */}
            <div>
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-sm text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 mb-4">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Điểm ưu tiên quy đổi</strong> = Điểm UT (Khu vực, Đối tượng) / 3 × 10
                </span>
              </div>

              <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text-sec mb-2">
                Chọn Khu vực và Đối tượng ưu tiên
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={scores.khuVuc}
                    onChange={(e) => handleScoreChange('khuVuc', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main appearance-none"
                  >
                    <option value="0">Khu vực 3 (0 điểm)</option>
                    <option value="0.25">Khu vực 2 (0.25 điểm)</option>
                    <option value="0.5">Khu vực 2 NT (0.5 điểm)</option>
                    <option value="0.75">Khu vực 1 (0.75 điểm)</option>
                  </select>
                </div>
                <div>
                  <select
                    value={scores.doiTuong}
                    onChange={(e) => handleScoreChange('doiTuong', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main appearance-none"
                  >
                    <option value="0">Không thuộc đối tượng ưu tiên (0 điểm)</option>
                    <option value="1">Nhóm ưu tiên 2 (1 điểm)</option>
                    <option value="2">Nhóm ưu tiên 1 (2 điểm)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResult(true)}
            className="w-full mt-8 bg-gradient-to-r from-[#1a2d6d] to-[#3b7dd8] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            Tính điểm học lực
          </motion.button>
        </section>

        {/* Result Display */}
        <AnimatePresence>
          {showResult && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200 dark:border-dark-border shadow-xl overflow-hidden"
            >
              {/* Result Header */}
              <div className="bg-gradient-to-r from-[#1a2d6d] to-[#3b7dd8] p-6 text-white text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-300" />
                <h2 className="text-xl font-bold mb-1">Kết quả tính điểm PT2</h2>
                <p className="text-primary-200">
                  {hasDGNL ? 'Có thi ĐGNL' : 'Không thi ĐGNL'}
                </p>
              </div>

              <div className="p-6">
                {/* Score Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-400">Điểm năng lực</span>
                      <p className="text-xs text-blue-500 dark:text-blue-500/80 mt-0.5">
                        {hasDGNL 
                          ? `(${scores.dgnlScore || 0} + ${scores.dgnlToan || 0} × 2) / 15`
                          : `${result.diemTNTHPTQuyDoi} × 0.75`
                        }
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{result.diemNangLuc}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                    <div>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">Điểm TNTHPT quy đổi</span>
                      <p className="text-xs text-emerald-500 dark:text-emerald-500/80 mt-0.5">
                        ({result.tongTNTHPT} / 4) × 10
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.diemTNTHPTQuyDoi}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
                    <div>
                      <span className="font-medium text-purple-700 dark:text-purple-400">Điểm học THPT quy đổi</span>
                      <p className="text-xs text-purple-500 dark:text-purple-500/80 mt-0.5">
                        (({scores.hocbaToan || 0} × 2 + {scores.hocbaMon2 || 0} + {scores.hocbaMon3 || 0}) / 4) × 10
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">{result.diemHocTHPTQuyDoi}</span>
                  </div>
                </div>

                {/* Final Score */}
                <div className="border-t-2 border-dashed border-neutral-200 dark:border-dark-border pt-6">
                  <div className="text-center">
                    <p className="text-sm text-neutral-500 dark:text-dark-text-sec mb-1">
                      Điểm học lực = {result.diemNangLuc} × 70% + {result.diemTNTHPTQuyDoi} × 20% + {result.diemHocTHPTQuyDoi} × 10% = <strong className="text-neutral-800 dark:text-neutral-200">{result.diemHocLuc}</strong>
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-dark-text-sec mb-3">
                      Điểm xét tuyển = Học lực ({result.diemHocLuc}) + Điểm cộng ({result.diemCong}) + Ưu tiên ({result.diemUuTien})
                    </p>
                    <div className="inline-flex flex-col items-center gap-1 bg-gradient-to-r from-[#1a2d6d] to-[#3b7dd8] text-white px-8 py-4 rounded-2xl shadow-lg shadow-blue-900/20">
                      <span className="text-lg font-medium">Tổng điểm xét tuyển:</span>
                      <span className="text-4xl font-bold">{result.diemXetTuyen}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-neutral-500 dark:text-dark-text-sec mb-1">
                    <span>0</span>
                    <span>100</span>
                  </div>
                  <div className="h-4 bg-neutral-100 dark:bg-dark-hover rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(parseFloat(result.diemXetTuyen), 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#1a2d6d] to-[#3b7dd8] rounded-full"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-1">Lưu ý</p>
                    <p>Đây là công cụ tính điểm tham khảo theo công thức PT2 của ĐH Bách Khoa TP.HCM. Kết quả thực tế có thể khác tùy thuộc vào quy định từng năm.</p>
                  </div>
                </div>
              </div>

              {/* Score Comparison Section */}
              <div className="border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                    Với mức điểm <span className="text-blue-600 dark:text-blue-400">{result.diemXetTuyen}</span> năm 2025, bạn sẽ nhận được kết quả như sau (so với điểm chuẩn 2025):
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a href="https://drive.google.com/drive/folders/1rJjGjYOCDK0uqnJkI1uYBrkzF9W2WlCn?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                      <ExternalLink className="w-4 h-4" /> Xem điểm các năm
                    </a>
                    <a href="https://drive.google.com/drive/folders/1J7yXVYZQVQnEStFuIPor8IN4B9zM-JrZ?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                      <ExternalLink className="w-4 h-4" /> Cách tính điểm 2026
                    </a>
                  </div>
                </div>

                {loadingScores ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-500 dark:text-dark-text-sec">Đang tải dữ liệu điểm chuẩn 2025...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const userScore = parseFloat(result.diemXetTuyen);
                      const qualDaiTra = admissionScores.daiTra.filter(p => userScore >= p.score);
                      const unqualDaiTra = admissionScores.daiTra.filter(p => userScore < p.score);
                      const qualOISP = admissionScores.oisp.filter(p => userScore >= p.score);
                      const unqualOISP = admissionScores.oisp.filter(p => userScore < p.score);
                      const totalQual = qualDaiTra.length + qualOISP.length;
                      const totalUnqual = unqualDaiTra.length + unqualOISP.length;
                      const total = admissionScores.daiTra.length + admissionScores.oisp.length;

                      const toggleMain = (key) => setExpandedMain(prev => ({ ...prev, [key]: !prev[key] }));
                      const toggleSub = (key) => setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));

                      const renderProgramList = (programs, isQualifying) => (
                        <ul className="space-y-2 mt-2 border-l-2 border-neutral-200 dark:border-dark-border ml-2 pl-4">
                          {programs.map(p => (
                            <li key={p.code} className="flex items-start justify-between text-sm py-1 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-100/50 dark:hover:bg-dark-hover transition-colors rounded px-2">
                              <div className="flex items-start gap-2 pr-4">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isQualifying ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-neutral-700 dark:text-neutral-300">{p.name} <span className="text-neutral-400 dark:text-neutral-500 text-xs">({p.code})</span></span>
                              </div>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex-shrink-0">{p.score}</span>
                            </li>
                          ))}
                        </ul>
                      );

                      return (
                        <>
                          {/* Qualifying Programs */}
                          <div className="bg-white dark:bg-dark-surface rounded-xl border border-emerald-200 dark:border-emerald-900/30 overflow-hidden">
                            <button 
                              onClick={() => toggleMain('qual')}
                              className="w-full flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-400">1. Các ngành bạn đủ điểm ({totalQual}/{total})</h4>
                              </div>
                              {expandedMain.qual ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
                            </button>
                            
                            <AnimatePresence>
                              {expandedMain.qual && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-0">
                                    {totalQual === 0 ? (
                                      <p className="text-neutral-500 dark:text-neutral-400 italic py-2">Rất tiếc, mức điểm này chưa đủ đỗ ngành nào trong năm 2025.</p>
                                    ) : (
                                      <div className="space-y-4 pt-4">
                                        {qualDaiTra.length > 0 && (
                                          <div>
                                            <button onClick={() => toggleSub('qualDaiTra')} className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                              {expandedSub.qualDaiTra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              + Chương trình đại trà ({qualDaiTra.length})
                                            </button>
                                            {expandedSub.qualDaiTra && renderProgramList(qualDaiTra, true)}
                                          </div>
                                        )}
                                        {qualOISP.length > 0 && (
                                          <div>
                                            <button onClick={() => toggleSub('qualOISP')} className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                              {expandedSub.qualOISP ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              + Chương trình OISP (giảng dạy tiếng Anh, tiên tiến...) ({qualOISP.length})
                                            </button>
                                            {expandedSub.qualOISP && renderProgramList(qualOISP, true)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Non-Qualifying Programs */}
                          <div className="bg-white dark:bg-dark-surface rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden">
                            <button 
                              onClick={() => toggleMain('unqual')}
                              className="w-full flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <h4 className="font-bold text-red-800 dark:text-red-400">2. Các khoa/ngành bạn không đủ điểm ({totalUnqual}/{total})</h4>
                              </div>
                              {expandedMain.unqual ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5 text-red-600" />}
                            </button>
                            
                            <AnimatePresence>
                              {expandedMain.unqual && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-0">
                                    {totalUnqual === 0 ? (
                                      <p className="text-neutral-500 dark:text-neutral-400 italic py-2">Tuyệt vời! Bạn đủ điểm đỗ tất cả các ngành trong năm 2025.</p>
                                    ) : (
                                      <div className="space-y-4 pt-4">
                                        {unqualDaiTra.length > 0 && (
                                          <div>
                                            <button onClick={() => toggleSub('unqualDaiTra')} className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                              {expandedSub.unqualDaiTra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              + Chương trình đại trà ({unqualDaiTra.length})
                                            </button>
                                            {expandedSub.unqualDaiTra && renderProgramList(unqualDaiTra, false)}
                                          </div>
                                        )}
                                        {unqualOISP.length > 0 && (
                                          <div>
                                            <button onClick={() => toggleSub('unqualOISP')} className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                              {expandedSub.unqualOISP ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              + Chương trình OISP (giảng dạy tiếng Anh, tiên tiến...) ({unqualOISP.length})
                                            </button>
                                            {expandedSub.unqualOISP && renderProgramList(unqualOISP, false)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
