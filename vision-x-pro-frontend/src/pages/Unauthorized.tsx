import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h1>
      <p className="text-gray-600 mb-6">Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.</p>
      <button 
        onClick={() => navigate('/')} 
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Ana Sayfaya Dön
      </button>
    </div>
  );
}
