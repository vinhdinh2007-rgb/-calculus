import React, { useState, useMemo } from 'react';
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
  Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ScoreCalculator() {
  const [hasDGNL, setHasDGNL] = useState(true); // Có thi ĐGNL hay không
  const [scores, setScores] = useState({
    dgnlScore: '',        // Điểm ĐGNL đã trừ Toán (0-900)
    dgnlToan: '',         // Điểm Toán trong ĐGNL
    tnthptToan: '',       // Điểm Toán TNTHPT
    tnthptMon2: '',       // Điểm môn 2 TNTHPT
    tnthptMon3: '',       // Điểm môn 3 TNTHPT
    hocbaToan: '',        // TB điểm Toán 3 năm
    hocbaMon2: '',        // TB điểm môn 2 3 năm
    hocbaMon3: '',        // TB điểm môn 3 3 năm
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
      hocbaToan: '',
      hocbaMon2: '',
      hocbaMon3: '',
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
    const hocbaToan = parseFloat(scores.hocbaToan) || 0;
    const hocbaMon2 = parseFloat(scores.hocbaMon2) || 0;
    const hocbaMon3 = parseFloat(scores.hocbaMon3) || 0;

    // Điểm TNTHPT quy đổi = [Tổng điểm 3 môn, TOÁN x 2] / 4 x 10
    const tongTNTHPT = tnthptToan * 2 + tnthptMon2 + tnthptMon3;
    const diemTNTHPTQuyDoi = (tongTNTHPT / 4) * 10;

    // Điểm học THPT quy đổi = [Trung bình cộng điểm TB 3 năm các môn trong tổ hợp, TOÁN x 2] x 10
    const tongHocBa = hocbaToan * 2 + hocbaMon2 + hocbaMon3;
    const diemHocTHPTQuyDoi = (tongHocBa / 4) * 10;

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
              <div className="bg-white/10 rounded-xl p-4 font-mono text-sm backdrop-blur-sm border border-white/10">
                <p className="mb-2 leading-relaxed">
                  <span className="text-amber-300 font-bold">Điểm học lực</span> = 
                  <span className="text-emerald-300"> Điểm năng lực × 70%</span> + 
                  <span className="text-blue-300"> Điểm TNTHPT<sub>quy đổi</sub> × 20%</span> + 
                  <span className="text-purple-300"> Điểm học THPT<sub>quy đổi</sub> × 10%</span>
                </p>
                <p className="leading-relaxed border-t border-white/20 pt-2 mt-2">
                  <span className="text-pink-300 font-bold">Điểm xét tuyển</span> = 
                  <span className="text-amber-300"> Điểm học lực</span> + 
                  <span className="text-emerald-300"> Điểm cộng</span> + 
                  <span className="text-blue-300"> Điểm ưu tiên</span>
                </p>
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
              <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-dark-border bg-neutral-100 dark:bg-dark-hover">
                <img 
                  src="https://res.cloudinary.com/dzpwnejs8/image/upload/v1772278416/j6asgbnnih8ooarkcqsr.png" 
                  alt="Bảng quy đổi chứng chỉ quốc tế" 
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal"
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
                Điểm trung bình 3 năm THPT của từng môn trong tổ hợp
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'hocbaToan', placeholder: 'Môn Toán' },
                  { key: 'hocbaMon2', placeholder: 'Môn 2' },
                  { key: 'hocbaMon3', placeholder: 'Môn 3' }
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
                      className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
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
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'diemThuong', placeholder: 'Điểm thưởng' },
                  { key: 'diemXetThuong', placeholder: 'Xét thưởng' },
                  { key: 'diemKhuyenKhich', placeholder: 'Khuyến khích' }
                ].map((field) => (
                  <div key={field.key}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={scores[field.key]}
                      onChange={(e) => handleScoreChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-hover border border-neutral-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-neutral-900 dark:text-dark-text-main placeholder:text-neutral-400 dark:placeholder:text-dark-text-sec"
                    />
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
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
