
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Columns, GripVertical, ShoppingCart, ShieldAlert, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SortableProperty = ({ property, stageName }) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: property.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleListOnMarketplace = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const propertyData = property.properties || property;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-xl shadow-md border border-slate-200 touch-none hover:shadow-lg hover:border-purple-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div onClick={() => navigate(`/property/${propertyData.id}`)} className="cursor-pointer flex-grow overflow-hidden pr-2">
          <p className="font-bold text-slate-800 truncate text-base">{propertyData.address}</p>
          <div className="flex items-center text-sm text-slate-500 mt-1">
            <span className="font-semibold text-green-600">${Number(propertyData.price).toLocaleString()}</span>
            <span className="mx-2">|</span>
            <div className="flex items-center text-yellow-600">
              <Star className="w-3 h-3 mr-1" />
              <span>{propertyData.opportunity_score}</span>
            </div>
          </div>
        </div>
        <div {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
          <GripVertical className="w-5 h-5" />
        </div>
      </div>
      {stageName === 'Acquired' && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleListOnMarketplace}>
            <ShoppingCart className="w-4 h-4 mr-2" /> List on Marketplace
          </Button>
        </div>
      )}
    </div>
  );
};

const PipelineColumn = ({ stage, properties }) => {
  return (
    <div className="bg-slate-100/80 rounded-xl p-4 w-80 flex-shrink-0">
      <h3 className="font-bold text-lg text-slate-800 mb-4 px-2">{stage.name} <span className="text-sm font-medium text-slate-500">({properties.length})</span></h3>
      <SortableContext items={properties.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px]">
          {properties.map(prop => (
            <SortableProperty key={prop.id} property={prop} stageName={stage.name} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const PreFlightChecklistModal = ({ isOpen, onOpenChange, onConfirm }) => {
  const checklistItems = [
    "I have visually confirmed access via satellite/street view.",
    "I have reviewed the preliminary title report or Deal Dossier.",
    "I understand my bidding entity is correctly registered with the county.",
    "I have verified the auction time, date, and location/platform.",
    "I have a funding source confirmed for the maximum bid amount."
  ];
  const [checkedItems, setCheckedItems] = useState(new Array(checklistItems.length).fill(false));

  const handleCheckedChange = (index) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = !newCheckedItems[index];
    setCheckedItems(newCheckedItems);
  };

  const allChecked = checkedItems.every(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <ShieldAlert className="w-8 h-8 mr-3 text-orange-500" />
            Pre-Flight Checklist
          </DialogTitle>
          <DialogDescription>
            Confirm these critical steps before moving to the auction stage. This is your final guard against common mistakes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`check-${index}`}
                checked={checkedItems[index]}
                onCheckedChange={() => handleCheckedChange(index)}
              />
              <Label htmlFor={`check-${index}`} className="font-medium text-slate-700 cursor-pointer">
                {item}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!allChecked}>
            Confirm & Move to Auction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MyPipeline = () => {
  const { user, isDemo } = useAuth();
  const [stages, setStages] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistState, setChecklistState] = useState({ isOpen: false, propertyId: null, newStageId: null });
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: stagesData, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order');
      
      if (stagesError || !stagesData || stagesData.length === 0) {
        toast({ title: "Using Demo Data", description: "Could not fetch pipeline stages.", variant: "default" });
        const mockStages = [
          { id: 1, name: 'Researching', sort_order: 1 },
          { id: 2, name: 'Due Diligence', sort_order: 2 },
          { id: 3, name: 'Ready for Auction', sort_order: 3 },
          { id: 4, name: 'Acquired', sort_order: 4 },
          { id: 5, name: 'Sold', sort_order: 5 },
        ];
        setStages(mockStages);
      } else {
        setStages(stagesData);
      }

      if (!isDemo && user) {
        const { data: propsData, error: propsError } = await supabase
          .from('saved_properties')
          .select('id, pipeline_stage_id, properties(*)')
          .eq('user_id', user.id);

        if (!propsError && propsData && propsData.length > 0) {
          setProperties(propsData);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user, isDemo]);

  const moveProperty = async (propertyId, newStageId) => {
    const activeProperty = properties.find(p => p.id === propertyId);
    if (!activeProperty) return;

    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, pipeline_stage_id: newStageId } : p));

    if (user && !isDemo) {
      const { error } = await supabase
        .from('saved_properties')
        .update({ pipeline_stage_id: newStageId })
        .eq('id', propertyId);

      if (error) {
        setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, pipeline_stage_id: activeProperty.pipeline_stage_id } : p));
        toast({ title: "Error", description: "Could not move property.", variant: "destructive" });
      } else {
        toast({ title: "Pipeline Updated!", description: `Moved property to new stage.` });
      }
    } else {
      toast({ title: "Pipeline Updated! (Demo)", description: `Moved property to new stage.` });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const propertyId = active.id;
    const overContainerId = over.data.current?.sortable?.containerId;
    
    if (!overContainerId) return;

    const newStageId = Number(overContainerId);
    const newStage = stages.find(s => s.id === newStageId);
    const activeProperty = properties.find(p => p.id === propertyId);

    if (activeProperty.pipeline_stage_id === newStageId) return;

    if (newStage && newStage.name === 'Ready for Auction') {
      setChecklistState({ isOpen: true, propertyId, newStageId });
    } else {
      moveProperty(propertyId, newStageId);
    }
  };

  const handleConfirmChecklist = () => {
    const { propertyId, newStageId } = checklistState;
    if (propertyId && newStageId) {
      moveProperty(propertyId, newStageId);
    }
    setChecklistState({ isOpen: false, propertyId: null, newStageId: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>My Pipeline - Win With Deeds</title>
        <meta name="description" content="Visually manage your tax deed investment pipeline with a drag-and-drop Kanban board." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center">
            <Columns className="w-10 h-10 mr-3 text-purple-600" /> My Investment Pipeline
          </h1>
          <p className="text-lg text-slate-600">
            Drag and drop your deals to track them from research to closing.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex-grow flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
              {stages.map(stage => (
                <SortableContext key={stage.id} items={[]} id={String(stage.id)}>
                  <PipelineColumn
                    stage={stage}
                    properties={properties.filter(p => p.pipeline_stage_id === stage.id)}
                  />
                </SortableContext>
              ))}
            </div>
          </DndContext>
        )}
      </main>
      <Footer />
      <PreFlightChecklistModal 
        isOpen={checklistState.isOpen}
        onOpenChange={(isOpen) => setChecklistState(prev => ({ ...prev, isOpen }))}
        onConfirm={handleConfirmChecklist}
      />
    </div>
  );
};

export default MyPipeline;
