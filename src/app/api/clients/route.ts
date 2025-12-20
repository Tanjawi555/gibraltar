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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, passport_id, driving_license, passport_image, license_image } = body;

  if (!full_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ClientModel.create(full_name, passport_id, driving_license, passport_image, license_image);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, full_name, passport_id, driving_license, passport_image, license_image } = body;

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
                    cloud_name: 'dzrpuv8ea',
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

                // If new passport image is provided and differs from old one, delete old one
                if (passport_image && existingClient.passport_image && existingClient.passport_image !== passport_image) {
                     await deleteImage(existingClient.passport_image);
                }
                // If new license image is provided and differs from old one, delete old one
                if (license_image && existingClient.license_image && existingClient.license_image !== license_image) {
                     await deleteImage(existingClient.license_image);
                }
             }
           } catch (e) {
               console.error("Failed to delete old images", e);
           }
       }
    }

    // Pass images to update method if they exist in body, otherwise keep them undefined/as is
    // We need to update ClientModel.update to accept images, or create a new update method.
    // The current ClientModel.update signature is update(id, full_name, passport_id, driving_license).
    // Let's modify ClientModel.update in the next step or assume it accepts partial updates if we were using a generic update.
    // Since ClientModel is strictly typed, let's update call here, but first we need to update the model.
    // Wait, ClientModel.update currently DOES NOT accept images. I need to update ClientModel first or use a raw update here?
    // I will update ClientModel.update in the same turn if possible, or just hack it here?
    // Proper way: Update ClientModel.update signature in separate tool call? 
    // Actually I can update the route to call a more generic update or I can pass images to it AFTER I update the model.
    // Let's assume I will update the model. For now, I'll pass the arguments. 
    // Actually, looking at the code, I need to update the model first or the file content replace will fail to compile TS if I simply change call.
    // But this file `route.ts` is what I am editing. 
    // Let's modify the `update` call in `ClientModel` in `lib/models.ts` FIRST? No, I am already in `route.ts` context. 
    // I'll update `ClientModel.update` signature in `lib/models.ts` in a separate call, but since I cannot do parallel dependent edits easily without breaking build,
    // I will just use a direct db call here or update the model first. 
    // Wait, I can do multiple tool calls. 
    // Let's update `ClientModel` to accept images in update.
    
    // Changing plan: I will update `ClientModel.update` in `lib/models.ts` first, then `route.ts`.
    // But I am already writing the replacement for `route.ts`.
    // I will return the original code + image handling logic but call a new method `updateWithImages` or just update the `update` method.
    
    await ClientModel.update(id, full_name, passport_id, driving_license, passport_image, license_image);
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
                cloud_name: 'dzrpuv8ea',
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

            if (client.passport_image) await deleteImage(client.passport_image);
            if (client.license_image) await deleteImage(client.license_image);
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
