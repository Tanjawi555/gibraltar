import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClientModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const result = await ClientModel.getPaginated(page, limit, search);
  return NextResponse.json(result);
}

// POST
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, passport_id, driving_license, passport_image, license_image, address, id_number } = body;

  if (!full_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ClientModel.create(full_name, passport_id, driving_license, passport_image, license_image, address, id_number);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

// PUT
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, full_name, passport_id, driving_license, passport_image, license_image, address, id_number } = body;

  if (!id || !full_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
     // Check if images were changed and delete old ones
    if (passport_image || license_image) {
       const existingClient = await ClientModel.getById(id);
       if (existingClient) {
           try {
             const { v2: cloudinary } = await import('cloudinary');
             if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
                cloudinary.config({
                    cloud_name: 'da0h6izcq',
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                });

                const deleteImage = async (url: string) => {
                    if (!url.includes('cloudinary.com')) return;
                    const parts = url.split('/upload/');
                    if (parts.length < 2) return;
                    const versionAndId = parts[1].split('/');
                    versionAndId.shift(); 
                    const publicIdWithExt = versionAndId.join('/');
                    const publicId = publicIdWithExt.split('.')[0]; 
                    if (publicId) await cloudinary.uploader.destroy(publicId);
                };

                const deleteImagesIfReplaced = async (oldImagesStr: string | null | undefined, newImagesStr: string | null | undefined) => {
                     if (!oldImagesStr) return;
                     const oldImages = oldImagesStr.split(',');
                     const newImages = newImagesStr ? newImagesStr.split(',') : [];
                     
                     for (const oldUrl of oldImages) {
                         if (!newImages.includes(oldUrl)) {
                             await deleteImage(oldUrl)
                         }
                     }
                };

                await deleteImagesIfReplaced(existingClient.passport_image, passport_image);
                await deleteImagesIfReplaced(existingClient.license_image, license_image);
             }
           } catch (e) {
               console.error("Failed to delete old images", e);
           }
       }
    }

    await ClientModel.update(id, full_name, passport_id, driving_license, passport_image, license_image, address, id_number);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const client = await ClientModel.getById(id);
    
    if (client) {
      // Cloudinary deletion
      try {
        const { v2: cloudinary } = await import('cloudinary');
        
        // Configure only if env vars are present (to avoid crashing if not set)
        if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            cloudinary.config({
                cloud_name: 'da0h6izcq',
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            // Helper to clean up images
            const deleteImage = async (url: string) => {
                if (!url.includes('cloudinary.com')) return;
                // Extract public_id from URL: .../upload/v1234/folder/public_id.ext -> folder/public_id
                const parts = url.split('/upload/');
                if (parts.length < 2) return;
                
                const versionAndId = parts[1].split('/');
                versionAndId.shift(); // remove v<version>
                const publicIdWithExt = versionAndId.join('/');
                const publicId = publicIdWithExt.split('.')[0]; // remove extension

                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            };
            
            const deleteImageList = async (imagesStr: string | null | undefined) => {
                if (!imagesStr) return;
                const images = imagesStr.split(',');
                for (const url of images) {
                    await deleteImage(url);
                }
            };

            await deleteImageList(client.passport_image);
            await deleteImageList(client.license_image);
        } else {
             console.warn('CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET not found in environment variables. Skipping Cloudinary deletion.');
        }

      } catch (cloudinaryError) {
          console.error('Failed to delete images from Cloudinary:', cloudinaryError);
          // Continue with client deletion even if image deletion fails
      }

      // Legacy: Local file deletion (if any old files exist)
      try {
        const { unlink } = await import('fs/promises');
        const path = await import('path');
        const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

        if (client.passport_image && !client.passport_image.startsWith('http')) {
            await unlink(path.join(UPLOAD_DIR, client.passport_image)).catch(() => {});
        }
        if (client.license_image && !client.license_image.startsWith('http')) {
             await unlink(path.join(UPLOAD_DIR, client.license_image)).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    }

    await ClientModel.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
