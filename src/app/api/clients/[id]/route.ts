import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  try {
    const data = await request.json();
    const { id } = await ctx.params;
    await connectDB();
    const updatedClient = await Client.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  try {
    const { id } = await ctx.params;
    await connectDB();
    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
