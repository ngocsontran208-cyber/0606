import React, { useState, useEffect, useContext } from 'react';
import { CurriculumContext } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
// SỬA LỖI: "in" đã được đổi thành "from"
import { getReport, exportSupplementaryReport } from '../api/reportApi';
import { createOrUpdateSupplementary } from '../api/supplementaryApi';
import { CAN_EDIT_SUPPLEMENTARY, CAN_EXPORT_SUPPLEMENTARY } from '../utils/permissions';
import fileDownload from 'js-file-download';

// --- ICONS ---
// Thêm các icon SVG nhỏ để giao diện chuyên nghiệp hơn
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// Component con để hiển thị từng row
const SupplementaryItemForm = ({ item, userCanEdit, onSave }) => {
    // --- Logic (giữ nguyên 100%) ---
    const { user } = useAuth();
    const [link, setLink] = useState(item.link || '');
    const [priceUSD, setPriceUSD] = useState(item.priceUSD || '');
    const [priceVND, setPriceVND] = useState(item.priceVND || '');
    const [status, setStatus] = useState(item.status || 'pending');
    const [reason, setReason] = useState(item.reason || '');
    const [loading, setLoading] = useState(false);
    
    // --- SỬA LOGIC ---
    // Nếu item.id là null (sách thiếu), mặc định bật 'isEditing'
    const [isEditing, setIsEditing] = useState(item.id === null);

    useEffect(() => {
        setLink(item.link || '');
        setPriceUSD(item.priceUSD ? parseFloat(item.priceUSD).toString() : '');
        setPriceVND(item.priceVND ? parseFloat(item.priceVND).toString() : '');
        setStatus(item.status || 'pending');
        setReason(item.reason || '');
        // Nếu item.id là null (sách thiếu), luôn bật chế độ edit
        setIsEditing(item.id === null);
    }, [item]);

    const materialData = item.Material || {};

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const usd = priceUSD ? parseFloat(priceUSD) : null;
        const vnd = priceVND ? parseFloat(priceVND) : null;

        if (status === 'cannot_supplement' && !reason.trim()) {
            alert('Vui lòng nhập Nguyên nhân nếu không thể bổ sung.');
            setLoading(false);
            return;
        }

        try {
            const data = {
                materialId: item.materialId,
                link: link.trim() || null,
                priceUSD: usd,
                priceVND: vnd,
                status: status,
                reason: status === 'cannot_supplement' ? reason.trim() : null
            };

            await createOrUpdateSupplementary(data);
            setIsEditing(false); // Tắt editing sau khi lưu
            onSave(); // reload parent
            alert('Cập nhật thành công!');
        } catch (err) {
            console.error('Lỗi khi lưu:', err.response || err);
            alert('Lỗi khi lưu dữ liệu. Kiểm tra console.');
        } finally {
            setLoading(false);
        }
    };

    // --- Giao diện (Nâng cấp) ---
    const renderStatusBadge = (currentStatus) => {
        // Giao diện badge chuyên nghiệp, hiện đại
        const base = "text-xs font-medium px-2.5 py-0.5 rounded-full";
        switch (currentStatus) {
            case 'supplemented':
                return <span className={`${base} bg-green-100 text-green-800`}>Đã bổ sung</span>;
            case 'cannot_supplement':
                return <span className={`${base} bg-red-100 text-red-800`}>Không thể BS</span>;
            case 'pending':
            default:
                return <span className={`${base} bg-yellow-100 text-yellow-800`}>Chờ xử lý</span>;
        }
    };

    // Style cho input chuyên nghiệp
    const inputStyle = "block w-full px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 disabled:opacity-50";

    return (
        <tr className={`border-b transition-colors ${isEditing ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
            {/* Cell 1: Tên tài liệu */}
            <td className="px-5 py-4 text-sm font-medium text-gray-900 max-w-xs align-top">
                {materialData.title || 'N/A'}
            </td>
            {/* Cell 2: Tác giả */}
            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs align-top">
                {materialData.author || 'N/A'}
            </td>
            {/* Cell 3: Môn học */}
            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs align-top">
                {materialData.Course?.name || 'N/A'}
            </td>
            {/* Cell 4: Form/Thông tin */}
            <td className="px-5 py-4 text-sm text-gray-700 max-w-md align-top">
                {isEditing ? (
                    // --- FORM CHỈNH SỬA (UI nâng cấp) ---
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                className={inputStyle}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading}
                            >
                                <option value="pending">Chờ xử lý</option>
                                <option value="supplemented">Đã bổ sung</option>
                                <option value="cannot_supplement">Không thể BS</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                            <input
                                type="url"
                                className={inputStyle}
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://..."
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá USD</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputStyle}
                                    value={priceUSD}
                                    onChange={(e) => setPriceUSD(e.target.value)}
                                    placeholder="$0.00"
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá VNĐ</label>
                                <input
                                    type="number"
                                    step="1000"
                                    className={inputStyle}
                                    value={priceVND}
                                    onChange={(e) => setPriceVND(e.target.value)}
                                    placeholder="0đ"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        
                        {status === 'cannot_supplement' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên nhân</label>
                                <textarea
                                    className={`${inputStyle} min-h-[60px]`}
                                    rows="2"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Nguyên nhân..."
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {/* Nút bấm chuyên nghiệp */}
                        <div className="flex justify-end gap-3 pt-2">
                             {/* --- SỬA LOGIC --- */}
                            {/* Chỉ hiển thị nút Hủy nếu item đã tồn tại (item.id != null) */}
                            {item.id !== null && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditing(false)} 
                                    className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                            )}
                            <button 
                                type="submit" 
                                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                ) : (
                    // --- TRẠNG THÁI HIỂN THỊ (UI nâng cấp) ---
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {renderStatusBadge(status)}
                            {userCanEdit && (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150"
                                >
                                    <EditIcon />
                                    Sửa
                                </button>
                            )}
                        </div>
                        {link && (
                            <div className="text-sm">
                                <span className="font-medium text-gray-900">Link:</span>{' '}
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline break-all">
                                    {link.length > 50 ? link.slice(0, 50) + '...' : link}
                                </a>
                            </div>
                        )}
                        {(priceUSD || priceVND) && (
                            <div className="text-sm">
                                <span className="font-medium text-gray-900">Giá:</span>{' '}
                                {priceUSD && `$${parseFloat(priceUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                {priceUSD && priceVND && ' / '}
                                {priceVND && `${parseFloat(priceVND).toLocaleString('vi-VN')} đ`}
                            </div>
                        )}
                        {status === 'cannot_supplement' && reason && (
                            <div className="text-sm text-red-700 bg-red-50 p-2 rounded-md border border-red-200">
                                <span className="font-semibold">Lý do:</span> {reason}
                            </div>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
};


const SupplementaryMaterialsPage = () => {
    // --- Logic (giữ nguyên 100%) ---
    const { user } = useAuth();
    const { curriculums } = useContext(CurriculumContext);

    const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
    const [supplementaryData, setSupplementaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);
    const [error, setError] = useState(null);

    const userCanEdit = user && CAN_EDIT_SUPPLEMENTARY(user.role);
    const userCanExport = user && CAN_EXPORT_SUPPLEMENTARY(user.role);

    const fetchSupplementaryData = async (curriculumId) => {
        if (!curriculumId) {
            setSupplementaryData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // --- BẮT ĐẦU SỬA LOGIC ---
            // Gọi API (đúng)
            const res = await getReport({ curriculumId });

            // Lọc các tài liệu có 'source' là 'Bổ sung'
            const supplementaryMaterials = res.data.filter(item => item.source === 'Bổ sung');

            // Map qua TẤT CẢ item đã lọc, bao gồm cả "sách thiếu" (supplementaryData = null)
            const allSupplementaryItems = supplementaryMaterials.map(item => {
                // 'item' là một Material (tài liệu) từ API báo cáo
                // 'item.supplementaryData' có thể là OBJECT (nếu đã tồn tại) hoặc NULL (nếu là "sách thiếu")

                if (item.supplementaryData) {
                    // --- TRƯỜNG HỢP 1: ĐÃ CÓ (hiển thị để Edit) ---
                    // Tài liệu này đã có thông tin bổ sung, ta dùng thông tin đó
                    return {
                        ...item.supplementaryData,
                        // Đảm bảo materialId và thông tin Material được gán đúng
                        // item.id ở đây là Material ID
                        materialId: item.supplementaryData.materialId || item.id, 
                        Material: { title: item.title, author: item.author, Course: item.course }
                    };
                } else {
                    // --- TRƯỜNG HỢP 2: SÁCH THIẾU (hiển thị để Create) ---
                    // Tài liệu này chưa có thông tin (supplementaryData là null)
                    // Ta phải "TẠO GIẢ" một object supplementary trống để gán vào Form
                    return {
                        id: null, // Không có ID (vì chưa được tạo)
                        materialId: item.id, // Đây là ID của Material (RẤT QUAN TRỌNG)
                        link: '',
                        priceUSD: '',
                        priceVND: '',
                        status: 'pending', // Mặc định là 'chờ xử lý'
                        reason: '',
                        // Gán thông tin Material để hiển thị
                        Material: { title: item.title, author: item.author, Course: item.course }
                    };
                }
            });

            setSupplementaryData(allSupplementaryItems);
            // --- KẾT THÚC SỬA LOGIC ---

        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu. Kiểm tra kết nối API.');
            setSupplementaryData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplementaryData(selectedCurriculumId);
    }, [selectedCurriculumId]);

    const handleCurriculumChange = (e) => setSelectedCurriculumId(e.target.value);

    const handleExport = async () => {
        if (!selectedCurriculumId) return alert('Vui lòng chọn một Đề cương để xuất file.');

        setLoadingExport(true);
        try {
            const response = await exportSupplementaryReport(selectedCurriculumId);
            const contentDisposition = response.headers['content-disposition'];
            let filename = `danh-muc-bo-sung-export.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) filename = match[1].replace(/"/g, '');
            }
            fileDownload(response.data, filename);
            alert('Xuất file Excel thành công!');
        } catch (err) {
            console.error(err);
            alert(err.response?.status === 404 ? 'Không tìm thấy dữ liệu bổ sung.' : 'Xuất file thất bại!');
        } finally {
            setLoadingExport(false);
        }
    };

    const handleSaveCallback = () => fetchSupplementaryData(selectedCurriculumId);

    // --- Giao diện (Nâng cấp) ---
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tiêu đề trang chuyên nghiệp */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                    📋 Quản lý Danh mục Bổ sung
                </h1>
            </div>

            {/* Khung Filter & Export - thiết kế "card" sạch sẽ */}
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Bộ lọc đề cương */}
                    <div className="flex-1 min-w-0">
                        <label htmlFor="curriculum-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn Đề cương
                        </label>
                        <select
                            id="curriculum-select"
                            value={selectedCurriculumId}
                            onChange={handleCurriculumChange}
                            className="block w-full sm:w-80 border-gray-300 p-2 rounded-md shadow-sm text-base
                                       focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            disabled={loading}
                        >
                            <option value="">-- Chọn Đề cương --</option>
                            {curriculums?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                    {/* Nút Xuất Excel */}
                    {userCanExport && selectedCurriculumId && (
                        <div className="flex-shrink-0 mt-3 sm:mt-0">
                            <button
                                onClick={handleExport}
                                disabled={loading || loadingExport}
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-transparent 
                                           text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 
                                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                                           transition duration-150 disabled:opacity-50"
                            >
                                <ExportIcon />
                                {loadingExport ? 'Đang xuất...' : 'Xuất Excel'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Thông báo Lỗi */}
            {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

            {/* Bảng dữ liệu - thiết kế chuyên nghiệp */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                {loading ? (
                    <p className="text-center py-20 text-lg text-gray-500">Đang tải danh mục...</p>
                ) : supplementaryData.length === 0 && selectedCurriculumId ? (
                    <div className="text-center py-20 text-lg text-gray-600">
                        Không có tài liệu (nguồn "Bổ sung") cho đề cương này.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên tài liệu</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tác giả</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Môn học</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thông tin Bổ sung / Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {supplementaryData.map(item => (
                                <SupplementaryItemForm
                                    // --- SỬA KEY ---
                                    // 'item.id' có thể là null cho sách thiếu
                                    // 'item.materialId' sẽ luôn luôn tồn tại và là duy nhất
                                    key={item.materialId}
                                    item={item}
                                    userCanEdit={userCanEdit}
                                    onSave={handleSaveCallback}
                                />
                            ))}
                        </tbody>
                    </table>
                )}

                {!selectedCurriculumId && !loading && (
                    <div className="text-center py-20 text-lg text-gray-500">
                        Vui lòng chọn một Đề cương để xem Danh mục Bổ sung.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplementaryMaterialsPage;