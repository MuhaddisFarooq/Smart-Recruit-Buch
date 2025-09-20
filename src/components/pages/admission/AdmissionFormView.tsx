import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from 'next/image'
import { User, Phone, GraduationCap, Users, UserPlus, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {getImageFileUrl} from "@/lib/utils"

const FALLBACK_IMAGES = {
  photo: "https://www.gravatar.com/avatar/?d=mp",
  document: "https://placehold.co/600x400/png?text=No+Document",
}

const getImageUrl = (url: string | undefined, type: 'photo' | 'document') => {
  if (!url) return FALLBACK_IMAGES[type];
  try {
    // new URL(url);
    return getImageFileUrl(url);
  } catch {
    return FALLBACK_IMAGES[type];
  }
}

interface Education {
  year: string;
  board: string;
  degree: string;
  document: string;
  percentage: string;
  totalMarks: string;
  obtainedMarks: string;
}

interface Admission {
  applicationId: string;
  status: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  cnic: string;
  bloodGroup: string;
  nationality: string;
  photo: string;
  email: string;
  phone: string;
  whatsappNo: string;
  address: string;
  city: string;
  fatherName: string;
  fatherCnic: string;
  fatherOccupation: string;
  fathersoi: string;
  fatherMI: string;
  sourceoftutionfee: string;
  guardianName: string;
  RelationWithGuardian: string;
  guardianOccupation: string;
  guardianContact: string;
  guardianWhatsapp: string;
  education: Education[];
  domicile: string;
  cnicBform: string;
}

const isPdf = (url: string | undefined): boolean => {
  return !!url && url?.toLowerCase().endsWith(".pdf");
};

export default function AdmissionFormView({ admission }: { admission: Admission }) {
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; title: string } | null>(null);
console.log('admission', admission)
  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-800">Application Details</span>
              <span className="text-gray-500 font-medium">#{admission?.applicationId}</span>
            </div>
            <span className={`text-sm px-4 py-1.5 rounded-full font-medium
              ${admission?.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                admission?.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`}>
              {admission?.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Move Personal & Contact Info side by side */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="pb-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" /> Personal Information
                </h3>
                <div className="grid gap-4">
                  <p><span className="font-medium">Name:</span> {admission?.firstName} {admission?.lastName}</p>
                  <p><span className="font-medium">Gender:</span> {admission?.gender}</p>
                  <p><span className="font-medium">Date of Birth:</span> {new Date(admission?.dob).toLocaleDateString()}</p>
                  <p><span className="font-medium">CNIC:</span> {admission?.cnic}</p>
                  <p><span className="font-medium">Blood Group:</span> {admission?.bloodGroup}</p>
                  <p><span className="font-medium">Nationality:</span> {admission?.nationality}</p>
                </div>
              </div>
              
              <div className="pb-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" /> Contact Information
                </h3>
                <div className="grid gap-4">
                  <p><span className="font-medium">Email:</span> {admission?.email}</p>
                  <p><span className="font-medium">Phone:</span> {admission?.phone}</p>
                  <p><span className="font-medium">WhatsApp:</span> {admission?.whatsappNo}</p>
                  <p><span className="font-medium">Address:</span> {admission?.address}</p>
                  <p><span className="font-medium">City:</span> {admission?.city}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <Image 
                  src={getImageUrl(admission?.photo, 'photo')} 
                  alt="Student Photo" 
                  width={300} 
                  height={300}
                  className="rounded-lg border shadow-md object-cover w-full"
                />
              </div>
            </div>
          </div>

          {/* Education Information */}
          <div className="border rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Educational Background
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Year</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Degree</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Board</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Marks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admission?.education?.map((edu, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{edu.year}</td>
                      <td className="px-4 py-3 text-sm">{edu.degree}</td>
                      <td className="px-4 py-3 text-sm">{edu.board}</td>
                      <td className="px-4 py-3 text-sm">{edu.obtainedMarks}/{edu.totalMarks}</td>
                      <td className="px-4 py-3 text-sm">{edu.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Family & Guardian Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Family Information
              </h3>
              <div className="grid gap-4">
                <p><span className="font-medium">Father's Name:</span> {admission?.fatherName}</p>
                <p><span className="font-medium">Father's CNIC:</span> {admission?.fatherCnic}</p>
                <p><span className="font-medium">Father's Occupation:</span> {admission?.fatherOccupation}</p>
                <p><span className="font-medium">Source of Income:</span> {admission?.fathersoi}</p>
                <p><span className="font-medium">Monthly Income:</span> {admission?.fatherMI}</p>
                <p><span className="font-medium">Source of Tution Fee:</span> {admission?.sourceoftutionfee}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Guardian Information
              </h3>
              <div className="grid gap-4">
                <p><span className="font-medium">Guardian Name:</span> {admission?.guardianName}</p>
                <p><span className="font-medium">Relation:</span> {admission?.RelationWithGuardian}</p>
                <p><span className="font-medium">Occupation:</span> {admission?.guardianOccupation}</p>
                <p><span className="font-medium">Contact:</span> {admission?.guardianContact}</p>
                <p><span className="font-medium">WhatsApp:</span> {admission?.guardianWhatsapp}</p>
              </div>
            </div>
          </div>

          {/* Documents Section - Moved to end */}
          <div className="border rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b flex items-center gap-2">
              Documents
            </h3>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { url: admission?.domicile, title: 'Domicile' },
                  { url: admission?.cnicBform, title: 'CNIC/B-Form' },
                  ...admission?.education?.map(edu => ({
                    url: edu.document,
                    title: `${edu.degree} Certificate`
                  })) || []
                ].map((doc, idx) => (
                  <div key={idx} className="group relative">
                    <div className="aspect-[4/3] relative overflow-hidden rounded-lg border">
                    {isPdf(doc?.url) ? (
        <iframe
          src={getImageUrl(doc?.url, 'document')}
          className="w-full h-full border rounded-lg"
        />
      ) : (
        <Image 
        src={getImageUrl(doc?.url, 'document')}
        alt={doc?.title}
        fill
        className="object-cover"
      />
      )}
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-2 bg-white rounded-full"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-center">{doc.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document View Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[16/9]">
          {selectedDoc && isPdf(selectedDoc.url) ? (
        <iframe
          src={getImageUrl(selectedDoc.url, 'document')}
          className="w-full h-full border rounded-lg"
        />
      ) : (
        <Image
          src={getImageUrl(selectedDoc?.url, 'document')}
          alt={selectedDoc?.title || 'Document'}
          fill
          className="object-contain"
        />
      )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
