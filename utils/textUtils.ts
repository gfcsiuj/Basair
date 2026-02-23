/**
 * أدوات معالجة النصوص العربية للمطابقة الصوتية
 * Arabic Text Processing Utilities for Voice Matching
 */

/**
 * حساب مسافة ليفنشتاين بين نصين
 * Levenshtein distance for fuzzy string comparison
 */
const levenshteinDistance = (a: string = '', b: string = ''): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = Array(b.length + 1)
        .fill(null)
        .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,       // حذف
                matrix[j - 1][i] + 1,       // إدراج
                matrix[j - 1][i - 1] + cost // استبدال
            );
        }
    }
    return matrix[b.length][a.length];
};

/**
 * تطبيع النص العربي: إزالة التشكيل وتوحيد الأشكال المختلفة للحروف
 * Normalizes Arabic text by removing diacritics and unifying character forms
 *
 * - إزالة جميع الحركات والتشكيل (فتحة، ضمة، كسرة، سكون، شدة، تنوين... إلخ)
 * - توحيد أشكال الهمزات (أ، إ، آ → ا)
 * - توحيد التاء المربوطة والهاء (ة → ه)
 * - توحيد الياء والألف المقصورة (ى → ي)
 */
export const normalizeArabicText = (text: string): string => {
    if (!text) return '';
    return text
        // إزالة جميع علامات التشكيل والحركات العربية
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A\u06D4\u06DF-\u06E8\u06EA-\u06EF\uFE70-\uFE7F]/g, '')
        // توحيد أشكال الهمزات المختلفة إلى ألف عادي
        .replace(/[أإآٱ]/g, 'ا')
        // توحيد التاء المربوطة إلى هاء
        .replace(/ة/g, 'ه')
        // توحيد الألف المقصورة إلى ياء
        .replace(/ى/g, 'ي')
        // إزالة التطويل (الكشيدة)
        .replace(/ـ/g, '')
        .trim();
};

/**
 * مقارنة تقريبية بين كلمتين عربيتين
 * Fuzzy comparison between two Arabic words
 *
 * @param word1 - الكلمة الأولى (عادةً من التلاوة الصوتية)
 * @param word2 - الكلمة الثانية (عادةً من النص القرآني)
 * @param threshold - نسبة التطابق المطلوبة (افتراضي 0.8 = 80%)
 * @returns true إذا كانت نسبة التشابه >= الحد المطلوب
 */
export const fuzzyMatchWords = (
    word1: string,
    word2: string,
    threshold: number = 0.8
): boolean => {
    const normalized1 = normalizeArabicText(word1);
    const normalized2 = normalizeArabicText(word2);

    // إذا كانت الكلمتان متطابقتين تماماً بعد التطبيع
    if (normalized1 === normalized2) return true;

    // إذا كانت إحدى الكلمتين فارغة
    if (!normalized1 || !normalized2) return false;

    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    // حساب نسبة التشابه
    const similarity = 1 - distance / maxLength;
    return similarity >= threshold;
};
