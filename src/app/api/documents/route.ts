import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentModel } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  try {
    const documents = await DocumentModel.getAll(search, dateFrom, dateTo);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    // 1. Delete from Cloudinary
    try {
        const { v2: cloudinary } = await import('cloudinary');
        // Configure only if env vars are present (to avoid crashing if not set)
        const hasKey = !!process.env.CLOUDINARY_API_KEY;
        const hasSecret = !!process.env.CLOUDINARY_API_SECRET;
        console.log(`Cloudinary Config Check (Docs): Key=${hasKey}, Secret=${hasSecret}`);

        if (hasKey && hasSecret) {
            cloudinary.config({
                cloud_name: 'dduryumsi',
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            // Robust extraction (same as in clients route)
            const regex = /\/upload\/(?:v\d+\/)?(.+)/;
            const match = url.match(regex);
            
            if (match && match[1]) {
                const publicIdWithExt = match[1];
                const lastDotIndex = publicIdWithExt.lastIndexOf('.');
                const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
                if (publicId) {
                    try {
                        console.log(`Docs DELETE: Attempting DELETE for ID: [${publicId}]`);
                        const result = await cloudinary.uploader.destroy(publicId);
                        console.log('Docs DELETE: Cloudinary Destroy Result:', JSON.stringify(result));
                    } catch (err) {
                         console.error('Docs DELETE: Cloudinary Destroy Error:', err);
                    }
                }
            } else {
                 console.log('Docs DELETE: Regex mismatch for URL:', url);
            }
        }
    } catch (e) {
        console.error("Cloudinary delete failed", e);
    }
    
    // 2. Delete from MongoDB Documents collection
    await DocumentModel.deleteByUrl(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
