"use client";
import Footer from "@/components/Footer";
import Partners from "@/components/Partners";
import MarketTrendEventPage from "@/components/components/MarketTrendEventPage";
import OrderBookPart from "@/components/components/OrderBook";
import { BET_SCALE_FACTOR, formatBetAmount } from "@/config/betting";
import MultiOptionBet from "@/components/components/MultiOptionBet";
import MultiOptionTrendChart from "@/components/components/MultiOptionTrendChart";
import { getEventById, getPastEventById, getOrderBookForEvent, getMarketTrend } from "@/utils/data/dataService";
import { Event as EventType } from "@/utils/data/types";
import { useAppContext } from "@/components/Context";
import { hashBet } from "@/components/bets/Betv2";

// Extended type to handle past event properties
interface ResolvedEvent extends EventType {
  resolved_date?: string;
  winning_outcome?: string;
  final_odds?: any;
  resolution_source?: string;
  resolution_details?: string;
  history?: { date: string; probability: number }[];
  probabilityChange?: string;
}
import Image from "next/image";
import { useState } from "react";

interface PageProps {
  params: {
    id: string;
  }
}

interface MainPageProps {
  data: EventType;
  selectedOptionId?: string;
  onOptionChange?: (optionId: string) => void;
}

interface BuyButtonsProps {
  event: EventType;
  selectedOptionId?: string;
}

const BuyButtons = ({ event, selectedOptionId }: BuyButtonsProps) => {
  // Get context for managing bets
  const { bets: [, setBets], show: [, setShow] } = useAppContext();
  
  // Handle bet placement
  const handleBet = (betType: "yes" | "no", optionTitle?: string) => {
    const title = optionTitle || event.title;
    
    const bet = {
      id: hashBet({
        date: new Date(),
        title: title,
      }),
      chosen: betType === "yes" ? "Yes" : "No",
      bet: betType,
      match: title,
      odds: optionTitle ? 
        event.options?.find(opt => opt.title === optionTitle)?.probability || event.probability :
        event.probability,
    };

    setBets((bets) => [bet, ...bets]);
    setShow(true);
  };
  
  // For simple yes/no bets
  if (!event.options || event.options.length === 0) {
    const yesPrice = formatBetAmount(event.probability * BET_SCALE_FACTOR);
    const noPrice = formatBetAmount((100 - event.probability) * BET_SCALE_FACTOR);
    
    return (
      <div className="fixed bottom-[64px] border border-opacity-50 border-chipz-gray-light left-0 right-0 z-10 bg-gray-900 p-4">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => handleBet("yes")}
              className="flex-1 py-2 px-2 rounded-lg bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10"
            >
              Buy Yes {yesPrice}$
            </button>
            <button 
              onClick={() => handleBet("no")}
              className="flex-1 py-2 px-2 rounded-lg bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10"
            >
              Buy No {noPrice}$
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // For multi-option bets
  const selectedOption = selectedOptionId 
    ? event.options.find(opt => opt.id === selectedOptionId)
    : event.options[0];
    
  if (!selectedOption) return null;
  
  const optionPrice = formatBetAmount(selectedOption.probability * BET_SCALE_FACTOR);
  const oppositePrice = formatBetAmount((100 - selectedOption.probability) * BET_SCALE_FACTOR);
  
  return (
    <div className="fixed bottom-[64px] border border-opacity-50 border-chipz-gray-light left-0 right-0 z-10 bg-gray-900 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex gap-2">
          <button 
            onClick={() => handleBet("yes", selectedOption.title)}
            className="flex-1 py-2 px-2 rounded-lg bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10"
            title={`Buy ${selectedOption.title} ${optionPrice}$`}
          >
            Buy <span className="inline-block align-bottom max-w-[85px] overflow-hidden text-ellipsis whitespace-nowrap">{selectedOption.title}</span> {optionPrice}$
          </button>
          <button 
            onClick={() => handleBet("no", selectedOption.title)}
            className="flex-1 py-2 px-2 rounded-lg bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10"
            title={`Sell ${selectedOption.title} ${oppositePrice}$`}
          >
            Sell <span className="inline-block align-bottom max-w-[85px] overflow-hidden text-ellipsis whitespace-nowrap">{selectedOption.title}</span> {oppositePrice}$
          </button>
        </div>
      </div>
    </div>
  );
};

const SimpleYesNoBet = ({ event }: { event: EventType }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <div className="flex text-xs">
          {event.conditional === "yes" ? <p>Yes</p> : <p>No</p>}
        </div>
        <h2 className="text-white text-lg font-bold">{event.probability}% chance</h2>
      </div>
      <div className="w-full min-h-[250px]">
        <MarketTrendEventPage 
          market={getMarketTrend(event.id)}
        />
      </div>
      <OrderBookPart orderBookData={getOrderBookForEvent(event.id)} />
    </div>
  );
};

const MainPage = ({ data, selectedOptionId, onOptionChange }: MainPageProps) => {
  const isMultiOptionBet = data.options && data.options.length > 0;
  
  return (
    <div className="flex flex-col mx-3 mt-2 gap-3 text-white">
      <div className="flex flex-col items-start gap-2">
        <Image
          src={data.imageUrl}
          alt="event-banner"
          className="object-cover rounded-md"
          width={45}
          height={45}
        />
        <h2 className="text-white text-lg font-bold">{data.title}</h2>
      </div>
      
      <div className="flex flex-col w-full gap-6">
        {isMultiOptionBet ? (
          <>
            <MultiOptionTrendChart event={data} />
            
            {/* Individual option selector and details */}
            <div className="w-full bg-gray-800 bg-opacity-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Options</h3>
              <MultiOptionBet 
                event={data}
                selectedOptionId={selectedOptionId}
                onOptionChange={onOptionChange}
              />
            </div>
          </>
        ) : (
          <>
            <SimpleYesNoBet event={data} />
          </>
        )}
      </div>
    </div>
  );
};

export default function Page({ params }: PageProps) {
  // Try to get the event from both active and past events
  const activeEvent = getEventById(params.id);
  const pastEvent = getPastEventById(params.id);
  const event = activeEvent || pastEvent as ResolvedEvent | undefined;
  
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(
    event?.options && event.options.length > 0 ? event.options[0].id : undefined
  );
  
  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-4">
          <h2 className="text-xl text-red-500">Event not found</h2>
          <p className="text-gray-400 mt-2">The event you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  // Handle option change
  const handleOptionChange = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  // Convert event to the format expected by MarketTrendEventPage
  const marketData = {
    id: event.id,
    probabilityChange: (event as ResolvedEvent).probabilityChange || "+0.0%",
    history: (event as ResolvedEvent).history || []
  };

  return (
    <main className="flex flex-col gap-5 pb-20">
      {/* Main content */}
      <MainPage data={event} selectedOptionId={selectedOptionId} onOptionChange={handleOptionChange} />
      
      {/* Show the market trend data if available and the event has options */}
      {event?.options && event.options.length > 0 && event.historyData && event.historyData.length > 0 && (
        <div className="px-4">
          <MarketTrendEventPage market={marketData} />
        </div>
      )}
      
      <Partners />
      <Footer />
      <BuyButtons event={event} selectedOptionId={selectedOptionId} />
    </main>
  );
}
