
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get a specific repair by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Repair ID required' },
        { status: 400 }
      );
    }

    const repair = await prisma.repairOrder.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        vehicle: {
          include: {
            client: true
          }
        },
        client: true,
        assignedTo: true
      }
    });

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(repair);
  } catch (error) {
    console.error('Error fetching repair:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing repair
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Repair ID required' },
        { status: 400 }
      );
    }

    // Verify that the repair exists and belongs to the company
    const existingRepair = await prisma.repairOrder.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      }
    });

    if (!existingRepair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }

    // Clean and validate input data
    const cleanData: any = {
      problem: body.description?.trim() || existingRepair.problem,
      status: body.status || existingRepair.status,
    };

    // Handle optional fields
    if (body.clientId !== undefined) {
      cleanData.clientId = body.clientId === '' || body.clientId === 'no_client' ? null : body.clientId;
    }

    if (body.assignedToId !== undefined) {
      cleanData.assignedToId = body.assignedToId === '' || body.assignedToId === 'no_assignment' ? null : body.assignedToId;
    }

    if (body.estimatedCost !== undefined) {
      const cost = parseFloat(body.estimatedCost);
      cleanData.estimatedCost = isNaN(cost) ? null : cost;
    }

    if (body.estimatedEndDate !== undefined) {
      if (body.estimatedEndDate && body.estimatedEndDate !== '') {
        cleanData.estimatedEndDate = new Date(body.estimatedEndDate);
      } else {
        cleanData.estimatedEndDate = null;
      }
    }

    // Update the repair
    const updatedRepair = await prisma.repairOrder.update({
      where: { id },
      data: cleanData,
      include: {
        vehicle: {
          include: {
            client: true
          }
        },
        client: true,
        assignedTo: true
      }
    });

    return NextResponse.json(updatedRepair);
  } catch (error) {
    console.error('Error updating repair:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating repair' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a repair
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Repair ID required' },
        { status: 400 }
      );
    }

    // Verify that the repair exists and belongs to the company
    const existingRepair = await prisma.repairOrder.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      }
    });

    if (!existingRepair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }

    // Delete the repair (cascade will handle related logs)
    await prisma.repairOrder.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Repair deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting repair:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete repair due to existing dependencies. Please delete related records first.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error while deleting repair' },
      { status: 500 }
    );
  }
}
