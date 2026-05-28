import React from 'react';
import { FileText, ShieldAlert, Award, Calendar } from 'lucide-react';

const MedicalRecords = () => {
  // Mirroring consultation structure schemas from the backend!
  const mockRecords = [
    {
      id: "c768-a85e",
      doctor_name: "Dr. Sarah Jenkins",
      date: "2026-05-25",
      symptoms_notes: "Patient reported acute tension headaches and episodic insomnia due to university workload stresses.",
      diagnosis: "Stress-induced Migraines",
      prescription: {
        medicine_name: "Paracetamol",
        dosage: "500mg",
        instructions: "Take 1 tablet every 8 hours as needed for severe headache management. Do not exceed 4 tablets a day."
      }
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Medical Vault</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Legally protected medical records and running prescriptions.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
          <Award className="h-4 w-4" /> HIPAA Secure Environment
        </div>
      </div>

      {/* Vault List Iteration */}
      <div className="space-y-6">
        {mockRecords.map((record) => (
          <div key={record.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Record Metadata Stripe */}
            <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-blue-600" /> {record.date}
              </div>
              <span className="text-xs text-gray-400 font-mono">Record ID: #{record.id}</span>
            </div>

            {/* Record Clinical Contents */}
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Attending Physician</h3>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{record.doctor_name}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Clinical Diagnosis</h3>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">{record.diagnosis}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Symptoms & Clinical Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  {record.symptoms_notes}
                </p>
              </div>

              {/* Prescriptions Sub-Card */}
              <div className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/10 rounded-xl p-5">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" /> Active Pharmacy Prescription Attached
                </h4>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-base">{record.prescription.medicine_name}</span>
                    <span className="text-xs text-gray-500 font-medium">{record.prescription.dosage}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-50 dark:border-gray-800">
                    " {record.prescription.instructions} "
                  </p>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default MedicalRecords;